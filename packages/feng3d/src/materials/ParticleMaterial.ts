declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ParticleMaterial: MaterialLogic;
    }
}

import { computed, effect, reactive, registerLogic, toRaw } from '@feng3d/reactivity';
import { BlendState, RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import type { Color4 } from '../core/Color4';
import { getParticleShaderWGSL } from '../shaders/particleMaterial';
import { defaultParticleTexture } from '../textures/createTexture';
import { isTextureFieldLoaded, resolveTexture, TextureField, TextureResource } from '../textures/TextureResource';
import { Material, MaterialLogic, materialLogic, writeMaterialBase, writeTextureBindings } from './Material';

/**
 * 把声明式纹理引用收窄成 TextureField（与 TextureMaterial 同款处理）。
 */
const asTextureField = (value: unknown): TextureField => value as TextureField;

/**
 * 默认采样器（线性过滤 + clamp-to-edge）。
 *
 * 粒子贴图不做平铺，边界取 clamp 可避免图集边缘的相邻像素渗色。
 */
const DEFAULT_SAMPLER: Sampler = {
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    maxAnisotropy: 1,
};

/**
 * 从纹理构建 2d TextureView。
 */
function buildTextureView(texture: Texture): TextureView
{
    return {
        texture: texture as unknown as TextureView['texture'],
        dimension: '2d',
    };
}

declare module './Material'
{
    export interface MaterialMap
    {
        ParticleMaterial: ParticleMaterial;
    }
}

/**
 * 粒子材质 uniforms（色调）。
 */
export interface ParticleUniforms
{
    /** 色调（与粒子颜色、贴图逐分量相乘） */
    readonly u_TintColor: Color4;
}

/**
 * 粒子材质（纯数据接口）。
 *
 * 使用粒子着色器（见 shaders/particleMaterial.ts）：顶点读 `a_particle_*` 实例属性做
 * 缩放 / 旋转 / 公告牌 / 位移，片元做「贴图 × 粒子颜色 × 色调」。
 *
 * 顶点实例属性由 ParticleSystem 写入 renderObject.vertices，本材质只负责管线与绑定。
 *
 * 可选 {@link blend} 字段切换混合方式（加性粒子用 `{ color: { srcFactor: 'one', dstFactor: 'one' } }`）；
 * 启用混合时 {@link MaterialLogic.isTransparent} 为 true，参与透明排序。
 */
export interface ParticleMaterial extends Material
{
    readonly __type__: 'ParticleMaterial';
    readonly uniforms: ParticleUniforms;
    /** 粒子贴图（运行时 Texture 或 `{ __type__: 'Texture', url }` 声明式引用） */
    readonly s_texture: Texture | TextureResource;
    /** 可选采样器（覆盖默认 clamp-to-edge 线性采样器） */
    readonly sampler?: Sampler;
    /**
     * 可选混合状态（省略时不启用 blend，粒子按不透明绘制）。
     */
    readonly blend?: BlendState;
    /**
     * 是否写入深度缓冲（缺省 `false`）。
     *
     * 粒子之间普遍互相重叠并有大量半透明像素，默认关闭深度写入以避免硬边与互相遮挡。
     */
    readonly depthWrite?: boolean;
}

/**
 * ParticleMaterial 逻辑类：填入粒子着色器，监听 s_texture 变化重算绑定。
 */
export interface ParticleMaterialLogic extends MaterialLogic
{
}

/**
 * 工厂函数：ParticleMaterialLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 材质数据（raw）
 */
export function particleMaterialLogic(data: ParticleMaterial): ParticleMaterialLogic
{
    const r_material = reactive(data);
    // uniforms 兜底：逐字段补齐（与 ColorMaterial / TextureMaterial 同因：缺字段会让
    // WGPUBufferBinding 取不到值并放弃上传，GPU 侧该字段恒为 0）
    const uniforms = () => (r_material.uniforms?.u_TintColor
        ? r_material.uniforms
        : {
            ...r_material.uniforms,
            u_TintColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        });
    const s_texture = () => resolveTexture(asTextureField(toRaw(r_material.s_texture)), defaultParticleTexture);
    const depthWrite = () => r_material.depthWrite ?? false;

    const shaderWGSL = getParticleShaderWGSL();

    const renderPipeline = reactive({
        vertex: { wgsl: shaderWGSL.vertex },
        fragment: { wgsl: shaderWGSL.fragment, targets: [{}] },
        // 不剔除：公告牌旋转后法线可能翻转，粒子面片两面都要可见
        primitive: { topology: 'triangle-list', cullFace: 'none', frontFace: 'ccw' },
        depthStencil: { depthWriteEnabled: depthWrite(), depthCompare: 'less' },
    }) as RenderPipeline;

    // @过渡 effect：blend → pipeline 派生字段可 computed 化
    effect(() =>
    {
        const target0 = reactive(renderPipeline).fragment?.targets?.[0] as { blend?: BlendState } | undefined;

        if (target0)
        {
            target0.blend = r_material.blend ? { ...r_material.blend } : undefined;
        }
    });

    // @过渡 effect：depthWrite → pipeline 派生字段可 computed 化
    effect(() =>
    {
        (reactive(renderPipeline).depthStencil as { depthWriteEnabled: boolean }).depthWriteEnabled
            = depthWrite();
    });

    // 纹理视图缓存：同一 Texture 复用同一 TextureView（稳定引用，避免每次重算新建 view）
    const viewCache = new Map<Texture, TextureView>();
    const textureViewOf = (texture: Texture): TextureView =>
    {
        let view = viewCache.get(texture);
        if (!view)
        {
            view = buildTextureView(texture);
            viewCache.set(texture, view);
        }

        return view;
    };

    // 纹理绑定（纯 computed）：字段变化或声明式纹理加载完成时精确失效
    const bindingResources = computed(() =>
    {
        const result: Record<string, import('@feng3d/webgpu').BindingResource> = {};
        // 变量名与着色器声明一致（独立 texture + sampler 两个变量）
        result.s_texture = textureViewOf(s_texture());
        result.s_textureSampler = r_material.sampler ?? DEFAULT_SAMPLER;

        return result;
    });

    // 组合基类工厂：未覆写的成员显式委托（不要用 ...base 展开——会把 getter 立刻求值）
    const base = materialLogic(data);

    const logic: ParticleMaterialLogic = {
        // 启用混合即视为半透明（供渲染排序 / 阴影目标筛选查询）
        get isTransparent() { return !!r_material.blend; },
        get isPrimitivesTopology() { return base.isPrimitivesTopology; },
        /** 加载状态：声明式引用查缓存（未加载时 false），运行时 Texture 视为已加载 */
        get isLoaded() { return isTextureFieldLoaded(asTextureField(toRaw(r_material.s_texture))); },
        beforeRender(renderObject)
        {
            writeMaterialBase(renderObject, renderPipeline, uniforms);
            writeTextureBindings(renderObject, bindingResources.value);
        },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('ParticleMaterial', particleMaterialLogic);
