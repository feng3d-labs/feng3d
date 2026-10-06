import { RenderPipeline, Texture, TextureView } from '@feng3d/webgpu';
import { Material, MaterialLogic, materialLogic, writeMaterialBase, writeTextureBindings } from './Material';
import { reactive, registerLogic, computed, toRaw } from '@feng3d/reactivity';
import { getDebugShadowMapShaderWGSL } from '../shaders/tsl/debugShadowMapMaterial';

declare module './Material'
{
    export interface MaterialMap
    {
        DebugShadowMapMaterial: DebugShadowMapMaterial;
    }
}

/**
 * 阴影图调试材质 uniforms。
 */
export interface DebugShadowMapUniforms
{
    /** 阴影图纹理尺寸（像素） */
    readonly u_texSize: { x: number; y: number };
}

/**
 * 阴影图调试材质（纯数据接口）。
 *
 * 用 textureLoad 读取 depth 纹理（texture_depth_2d）可视化输出灰度。
 * 用于调试方向光阴影图是否正确写入。
 */
export interface DebugShadowMapMaterial extends Material
{
    readonly __type__: 'DebugShadowMapMaterial';
    readonly uniforms: DebugShadowMapUniforms;
    /** 深度纹理（depth24plus） */
    readonly s_texture: Texture;
    /**
     * 是否写入深度缓冲（缺省取该材质原默认值）。
     *
     * 关闭后该材质的片元不更新深度，常用于图标 / 辅助线 / 描边等不希望互相遮挡、
     * 也不希望挡住场景的绘制（见 issue #157）。
     */
    readonly depthWrite?: boolean;
}

/**
 * 阴影图调试材质的默认占位纹理（1×1 depth24plus）。
 *
 * s_texture 必须是 depth 格式（shader 声明为 texture_depth_2d），
 * 不能用 defaultTexture（rgba8unorm），否则 BindGroup 校验失败。
 */
let _defaultDepthTexture: Texture | null = null;
function getDefaultDepthTexture(): Texture
{
    if (!_defaultDepthTexture)
    {
        _defaultDepthTexture = {
            descriptor: { size: [1, 1], format: 'depth24plus' },
        } as Texture;
    }

    return _defaultDepthTexture;
}

/**
 * DebugShadowMapMaterial logic：填入调试着色器，监听 s_texture 变化重算绑定。
 *
 * 通过 registerLogic('DebugShadowMapMaterial', debugShadowMapMaterial)
 * 注册，调用方用 `logic(material)` 获取实例。
 */
export interface DebugShadowMapMaterialLogic extends MaterialLogic
{
}

/**
 * 工厂函数：DebugShadowMapMaterialLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 材质数据（raw）
 */
export function debugShadowMapMaterialLogic(data: DebugShadowMapMaterial): DebugShadowMapMaterialLogic
{
    const r_material = reactive(data);
    // 用 TSL 构建的着色器（懒构建，见 shaders/tsl/debugShadowMapMaterial）
    const debugShader = getDebugShadowMapShaderWGSL();

    const uniforms = () => r_material.uniforms ?? { u_texSize: { x: 1024, y: 1024 } };
    const s_texture = () => r_material.s_texture ?? getDefaultDepthTexture();
    const depthWrite = () => r_material.depthWrite ?? false; // 缺省沿用该材质原默认值（issue #157）

    const renderPipeline = reactive({
        vertex: { wgsl: debugShader.vertex },
        fragment: { wgsl: debugShader.fragment, targets: [{}] },
        // 不剔除：调试平面两面都要可见（Billboard 旋转后法线可能翻转）
        primitive: { topology: 'triangle-list', cullFace: 'none', frontFace: 'ccw' },
        // 调试平面不需要深度写入/测试，始终覆盖
        depthStencil: { depthWriteEnabled: depthWrite(), depthCompare: 'always' },
    }) as RenderPipeline;

    // 纹理绑定（纯 computed）：字段变化时精确失效。
    // 纹理视图缓存：同一 Texture 复用同一 TextureView（稳定引用，避免 GPU 纹理重建）。
    const viewCache = new Map<unknown, TextureView>();
    const bindingResources = computed(() =>
    {
        // reactive 读取 s_texture 返回的是 Proxy：若直接作为 Texture 传给 webgpu 层，
        // ChainMap 按 Proxy 键查缓存会命中不到附件用的同一 GPUTexture（raw 键），
        // 从而新建一块未初始化的深度纹理（采样恒为 0）。必须 toRaw 还原（规范 8.6）。
        const texture = toRaw(s_texture()) as Texture;
        let view = viewCache.get(texture);
        if (!view)
        {
            // depth 纹理用 depth-only aspect 的 view（texture_depth_2d 要求）
            view = {
                texture: texture as unknown as TextureView['texture'],
                aspect: 'depth-only',
            };
            viewCache.set(texture, view);
        }

        const result: Record<string, import('@feng3d/webgpu').BindingResource> = {};
        // 键名必须与 WGSL 的变量名一致：TSL 的深度采样器同样按采样器展开约定命名
        // （`depthSampler(uniform('s_texture', …))` → `s_texture_texture`），
        // 写 `s_texture` 会在 WGPUBindGroupEntry 里找不到纹理绑定而抛错。
        result.s_texture_texture = view;

        return result;
    });

    // 组合基类工厂：未覆写的成员显式委托（不要用 ...base 展开——会把 getter 立刻求值）
    const base = materialLogic(data);

    const logic: DebugShadowMapMaterialLogic = {
        get isTransparent() { return base.isTransparent; },
        get isPrimitivesTopology() { return base.isPrimitivesTopology; },
        get isLoaded() { return base.isLoaded; },
        beforeRender(renderObject)
        {
            writeMaterialBase(renderObject, renderPipeline, uniforms);
            writeTextureBindings(renderObject, bindingResources.value);
        },
    };

    return logic;
}

registerLogic('DebugShadowMapMaterial', debugShadowMapMaterialLogic);


