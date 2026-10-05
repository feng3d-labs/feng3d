declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TextureMaterial: MaterialLogic;
    }
}

import type { Color4 } from '../core/Color4';
import { BlendState, RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import { getTextureShaderWGSL } from '../shaders/tsl/textureMaterial';
import { defaultTexture } from '../textures/createTexture';
import { isTextureFieldLoaded, resolveTexture, TextureField, TextureResource } from '../textures/TextureResource';
import { Material, MaterialLogic, materialLogic, writeMaterialBase, writeTextureBindings } from './Material';
import { effect, reactive, registerLogic, computed, toRaw } from '@feng3d/reactivity';

/**
 * 把声明式纹理引用收窄成 `TextureField`（两套声明下的"同名类型两种身份"，见 #133 / #360）。
 */
const asTextureField = (value: unknown): TextureField => value as TextureField;

/**
 * 默认采样器（线性过滤 + repeat 寻址）。
 */
const DEFAULT_SAMPLER: Sampler = {
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    maxAnisotropy: 1,
};

/**
 * 从纹理构建 TextureView（cube/cube-array 用 cube 视图，其余 2d）。
 */
function buildTextureView(texture: Texture): TextureView
{
    const dimension = texture.descriptor?.dimension;
    if (dimension === 'cube' || dimension === 'cube-array')
    {
        return {
            texture: texture as unknown as TextureView['texture'],
            dimension: 'cube',
            arrayLayerCount: 6,
        };
    }

    return {
        texture: texture as unknown as TextureView['texture'],
        dimension: '2d',
    };
}

declare module './Material'
{
    export interface MaterialMap
    {
        TextureMaterial: TextureMaterial;
    }
}

/**
 * 纹理材质 uniforms（颜色）。
 */
export interface TextureUniforms
{
    /** 颜色 */
    readonly u_color: Color4;
}

/**
 * 纹理材质（纯数据接口）。
 *
 * 使用 texture 着色器（采样纹理 × 材质颜色）。shader 与渲染状态由 materialLogic 在
 * 创建时填充到 renderPipeline，纹理 s_texture 由 materialLogic 监听变化重算
 * textureView/sampler 绑定，在 beforeRender 中写入 bindingResources。
 *
 * 可选 {@link sampler} 字段覆盖默认采样器（线性过滤），用于切换 Nearest/Linear 过滤、
 * 寻址模式等（对应 three.js Texture.magFilter/minFilter/wrapS/wrapT）。
 */
export interface TextureMaterial extends Material
{
    readonly __type__: 'TextureMaterial';
    readonly uniforms: TextureUniforms;
    /** 纹理（运行时 Texture 或 `{ __type__: 'Texture', url }` 声明式引用） */
    readonly s_texture: Texture | TextureResource;
    /** 可选采样器（覆盖默认线性采样器）。省略时用 DEFAULT_SAMPLER（linear + repeat）。 */
    readonly sampler?: Sampler;
    /**
     * 可选混合状态（省略时不启用 blend）。
     *
     * 材质语义属性（对应 three.js Material.blending/blendSrc/blendDst/blendEquation），
     * 经响应式修改可运行时切换（pipeline 由 logic 内部监听同步）。
     */
    readonly blend?: BlendState;

    /**
     * 是否写入深度缓冲（缺省 `true`）。
     *
     * 关闭后该材质的片元不更新深度，常用于图标 / 辅助线 / 描边等不希望互相遮挡、
     * 也不希望挡住场景的绘制。编辑器原先调 `setDepthWrite(material, false)`，
     * 而该值当时写死在 Logic 构造里、数据接口未暴露，只能降级为 `warnUnsupported`
     * （见 issue #157）。
     */
    readonly depthWrite?: boolean;
}

/**
 * TextureMaterial 逻辑类：填入 texture 着色器，监听 s_texture 变化重算绑定。
 */
export interface TextureMaterialLogic extends MaterialLogic
{
}

/**
 * 工厂函数：TextureMaterialLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 材质数据（raw）
 */
export function textureMaterialLogic(data: TextureMaterial): TextureMaterialLogic
{
    // 默认值 accessor：声明式引用经 resolveTexture 解析（占位符渐进换装，设计文档 3.2）
    const r_material = reactive(data);
    // uniforms 兜底：整体缺失、或存在但缺 u_color 时都要补齐。
    // 只做 `uniforms ?? 默认` 是不够的——图标的材质只声明了纹理（没有 uniforms.u_color），
    // 此时 WGPUBufferBinding 取不到该字段会打印「没有找到 统一块变量属性 u_color 的值」
    // 并放弃上传，GPU 侧 u_color 恒为 0，图标被乘成纯黑。
    const uniforms = () => (r_material.uniforms?.u_color
        ? r_material.uniforms
        : {
            ...r_material.uniforms,
            u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        });
    const s_texture = () => resolveTexture(asTextureField(toRaw(r_material.s_texture)), defaultTexture);
    const depthWrite = () => r_material.depthWrite ?? true;

    // TSL 构建的着色器（首次调用时构建并缓存，见 shaders/tsl/textureMaterial.ts）
    const shaderWGSL = getTextureShaderWGSL();

    const renderPipeline = reactive({
        vertex: { wgsl: shaderWGSL.vertex },
        fragment: { wgsl: shaderWGSL.fragment, targets: [{}] },
        primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'ccw' },
        depthStencil: { depthWriteEnabled: depthWrite(), depthCompare: 'less' },
    }) as RenderPipeline;

    // @过渡 effect：blend → pipeline 派生字段可 computed 化
    // 监听 blend 变化（省略时关闭混合；与 StandardMaterial.cullFace 同模式）
    effect(() =>
    {
        // targets 与 targets[0] 都是可选的（本仓开了 noUncheckedIndexedAccess）
        const target0 = reactive(renderPipeline).fragment?.targets?.[0] as { blend?: BlendState } | undefined;

        if (target0)
        {
            target0.blend = r_material.blend ? { ...r_material.blend } : undefined;
        }
    });

    // @过渡 effect：depthWrite → pipeline 派生字段可 computed 化
    // 监听 depthWrite 变化（字段缺失时按 true，与历史默认一致）
    effect(() =>
    {
        (reactive(renderPipeline).depthStencil as { depthWriteEnabled: boolean }).depthWriteEnabled
            = depthWrite();
    });

    // 纹理视图缓存：同一 Texture 复用同一 TextureView（稳定引用，避免每次重算
    // 新建 view 对象导致 WGPUTextureView 缓存失效、GPU 纹理重建泄漏）
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
        // 键名与 TSL 的采样器展开约定一致（见 shaders/tsl/textureMaterial.ts）：
        // TSL 把 sampler2D(uniform('s_texture')) 展开成 s_texture_texture（texture）+ s_texture（sampler），
        // 引擎按变量名解析绑定（WGPUBindGroupEntry），所以数据侧要提供同名的两个键。
        result.s_texture_texture = textureViewOf(s_texture());
        // sampler 字段优先，省略则用默认线性采样器
        result.s_texture = r_material.sampler ?? DEFAULT_SAMPLER;

        return result;
    });

    // 组合基类工厂：未覆写的成员显式委托（不要用 ...base 展开——会把 getter 立刻求值）
    const base = materialLogic(data);

    const logic: TextureMaterialLogic = {
        get isTransparent() { return base.isTransparent; },
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
registerLogic('TextureMaterial', textureMaterialLogic);
