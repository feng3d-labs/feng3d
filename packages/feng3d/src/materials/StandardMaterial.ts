declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        StandardMaterial: MaterialLogic;
    }
}

import type { Color4 } from '../core/Color4';
import { RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import { defaultCubeTexture, defaultNormalTexture, defaultTexture } from '../textures/createTexture';
import { isTextureFieldLoaded, resolveTexture, TextureField, TextureResource } from '../textures/TextureResource';
import { Material, MaterialLogic, materialLogic, writeMaterialBase, writeTextureBindings } from './Material';
import { standardVertexWGSL } from './standardVertexShader';
import { reactive, effect, registerLogic, computed, toRaw } from '@feng3d/reactivity';
import { getStandardFragmentWGSL } from '../shaders/tsl/standardFragment';

/**
 * 把声明式纹理引用收窄成 `TextureField`。
 *
 * editor 的编译上下文里 `TextureField` 有**两种来源**（两套 lib.dom / WebGPU 声明），结构相同却不能互赋；
 * 传参边界经它做一次窄断言（运行时零变化）。根因与 `HTMLCanvasElement` 的同类，见 #133 / #360。
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
        StandardMaterial: StandardMaterial;
    }
}

/**
 * 雾模式
 */
export enum FogMode
{
    NONE = 0,
    EXP = 1,
    EXP2 = 2,
    LINEAR = 3
}

/**
 * StandardMaterial uniforms。
 */
export interface StandardUniforms
{
    /** 漫反射颜色 */
    readonly u_diffuse?: Color4;
    /** 透明度阈值（alpha 测试） */
    readonly u_alphaThreshold?: number;
    /** 镜面反射颜色 */
    readonly u_specular?: Color4;
    /** 光泽度 */
    readonly u_glossiness?: number;
    /** 环境光颜色 */
    readonly u_ambient?: Color4;
    /** 反射率 */
    readonly u_reflectivity?: number;
    /** 雾起始距离 */
    readonly u_fogMinDistance?: number;
    /** 雾结束距离 */
    readonly u_fogMaxDistance?: number;
    /** 雾颜色 */
    readonly u_fogColor?: Color4;
    /** 雾密度 */
    readonly u_fogDensity?: number;
    /** 雾模式 */
    readonly u_fogMode?: FogMode;
}

/**
 * 标准材质（纯数据接口）。
 *
 * 使用 standard 着色器（漫反射纹理 + 环境光）。uniform 数据通过 {@link uniforms} 自动传递，
 * 纹理（s_diffuse / s_normal / s_specular / s_ambient / s_envMap）由 materialLogic 监听
 * 纹理字段变化重算 textureView/sampler 绑定，在 beforeRender 中写入 bindingResources。
 *
 * 注：地形 splat 纹理混合由独立的 TerrainMaterial 提供，本材质不含地形逻辑。
 */
export interface StandardMaterial extends Material
{
    readonly __type__: 'StandardMaterial';
    readonly uniforms?: StandardUniforms;
    /** 漫反射纹理（运行时 Texture 或 `{ __type__: 'Texture', url }` 声明式引用） */
    readonly s_diffuse?: Texture | TextureResource;
    /** 法线纹理 */
    readonly s_normal?: Texture | TextureResource;
    /** 镜面反射光泽图 */
    readonly s_specular?: Texture | TextureResource;
    /** 环境纹理 */
    readonly s_ambient?: Texture | TextureResource;
    /** 环境映射贴图（立方体） */
    readonly s_envMap?: Texture | TextureResource;
    /**
     * 背面剔除模式：
     * - `'back'`（默认）：剔除背面（单面渲染）
     * - `'none'`：不剔除（双面渲染，对应 three.js `DoubleSide`）
     */
    readonly cullFace?: 'back' | 'front' | 'none';

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
 * StandardMaterial 默认 uniforms 模板（缺失 uniforms 字段时使用）。
 *
 * 各 Color4 字面量随 uniforms 整体赋值，每次新建避免实例间共享引用。
 */
const STANDARD_DEFAULT_UNIFORMS = {
    u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    u_alphaThreshold: 0,
    u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
    u_glossiness: 50,
    u_ambient: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    u_reflectivity: 1,
    u_fogMinDistance: 0,
    u_fogMaxDistance: 100,
    u_fogColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
    u_fogDensity: 0.1,
    u_fogMode: FogMode.NONE,
};

/**
 * StandardMaterial logic：填入 standard 着色器，监听 9 个纹理变化重算绑定。
 *
 * 通过 registerLogic('StandardMaterial', standardMaterial) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
export interface StandardMaterialLogic extends MaterialLogic
{
}

/**
 * 工厂函数：StandardMaterialLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 材质数据（raw）
 */
export function standardMaterialLogic(data: StandardMaterial): StandardMaterialLogic
{
    // 默认值 accessor：声明式引用经 resolveTexture 解析（占位符渐进换装，设计文档 3.2）。
    // 经代理读取建立字段依赖，传参用原始对象（规范 8.6）。
    const r_material = reactive(data);
    const s_diffuse = () => resolveTexture(asTextureField(toRaw(r_material.s_diffuse)), defaultTexture);
    const s_normal = () => resolveTexture(asTextureField(toRaw(r_material.s_normal)), defaultNormalTexture);
    const s_specular = () => resolveTexture(asTextureField(toRaw(r_material.s_specular)), defaultTexture);
    const s_ambient = () => resolveTexture(asTextureField(toRaw(r_material.s_ambient)), defaultTexture);
    const s_envMap = () => resolveTexture(asTextureField(toRaw(r_material.s_envMap)), defaultCubeTexture);
    const cullFace = () => r_material.cullFace ?? 'back';
    const depthWrite = () => r_material.depthWrite ?? true;

    // uniforms 解析：缺失时整体用默认；部分提供时按字段补默认（不写入原始对象，每次解析）
    const uniforms = computed<StandardUniforms>(() =>
    {
        const userUniforms = r_material.uniforms;
        if (!userUniforms)
        {
            return JSON.parse(JSON.stringify(STANDARD_DEFAULT_UNIFORMS)) as StandardUniforms;
        }
        const r_user = reactive(userUniforms);
        const result = {} as Record<string, unknown>;
        for (const key in STANDARD_DEFAULT_UNIFORMS)
        {
            const userVal = r_user[key];
            result[key] = userVal !== undefined
                ? userVal
                : JSON.parse(JSON.stringify(STANDARD_DEFAULT_UNIFORMS[key]));
        }

        return result as unknown as StandardUniforms;
    });

    const renderPipeline = reactive({
        vertex: { wgsl: standardVertexWGSL },
        fragment: { wgsl: getStandardFragmentWGSL(), targets: [{}] },
        primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'ccw' },
        depthStencil: { depthWriteEnabled: depthWrite(), depthCompare: 'less' },
    }) as RenderPipeline;

    // @过渡 effect：cullFace → pipeline 派生字段可 computed 化
    // 监听 cullFace 变化（'back' 单面 / 'none' 双面 / 'front' 剔除正面）
    effect(() =>
    {
        (reactive(renderPipeline).primitive as { cullFace: 'back' | 'front' | 'none' }).cullFace
            = cullFace();
    });

    // @过渡 effect：depthWrite → pipeline 派生字段可 computed 化
    // 监听 depthWrite 变化（数据字段缺失时按 true，与历史默认一致）
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

    // 纹理绑定（纯 computed）：纹理字段变化或声明式纹理加载完成（缓存写入）时精确失效
    const textureByKey: Record<string, () => Texture> = {
        s_diffuse, s_normal, s_specular, s_ambient, s_envMap,
    };
    const bindingResources = computed<Record<string, import('@feng3d/webgpu').BindingResource>>(() =>
    {
        const result: Record<string, import('@feng3d/webgpu').BindingResource> = {};
        for (const key in textureByKey)
        {
            // 键名按 TSL 的采样器展开约定：sampler2D(uniform('s_diffuse')) 展开成
            // s_diffuse_texture（纹理）+ s_diffuse（采样器），与手写的
            // s_diffuse（纹理）+ s_diffuseSampler（采样器）相反。见 shaders/tsl/standardFragment.ts。
            result[key + '_texture'] = textureViewOf(textureByKey[key]());
            result[key] = DEFAULT_SAMPLER;
        }

        return result;
    });

    // 加载状态：声明式引用查缓存（未加载时 false），运行时 Texture 视为已加载
    const textureFields = () => [
        asTextureField(toRaw(r_material.s_diffuse)),
        asTextureField(toRaw(r_material.s_normal)),
        asTextureField(toRaw(r_material.s_specular)),
        asTextureField(toRaw(r_material.s_ambient)),
        asTextureField(toRaw(r_material.s_envMap)),
    ];

    // 组合基类工厂：未覆写的成员显式委托（不要用 ...base 展开——会把 getter 立刻求值）
    const base = materialLogic(data);

    const logic: StandardMaterialLogic = {
        get isTransparent() { return base.isTransparent; },
        get isPrimitivesTopology() { return base.isPrimitivesTopology; },
        get isLoaded() { return textureFields().every(f => isTextureFieldLoaded(f)); },
        beforeRender(renderObject)
        {
            writeMaterialBase(renderObject, renderPipeline, () => uniforms.value);
            writeTextureBindings(renderObject, bindingResources.value);
        },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('StandardMaterial', standardMaterialLogic);

// 注册默认材质工厂（由 Material.ts 的 ensureDefaultMaterials 惰性调用）
// Default-Material 使用 StandardMaterial。

// 标准顶点着色器 WGSL（含蒙皮变体）见 ./standardVertexShader：
// 这里只做转发导出，保持既有从 StandardMaterial 导入 standardVertexWGSL 的路径不变。
export { standardSkinnedVertexWGSL, standardVertexWGSL } from './standardVertexShader';







