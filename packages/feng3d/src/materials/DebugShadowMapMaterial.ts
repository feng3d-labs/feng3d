import { BufferBinding, RenderObject, RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { Material, MaterialLogic, writeMaterialBase, writeTextureBindings } from './Material';
import { reactive, registerLogic, computed, Computed, toRaw } from '@feng3d/reactivity';

/**
 * 默认采样器（线性过滤 + repeat 寻址）。
 *
 * 本材质用 textureLoad 读深度，实际不使用采样器；此处仅填充 binding 槽位。
 */
const DEFAULT_SAMPLER: Sampler = {
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    maxAnisotropy: 1,
};

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
 * class 实现：暴露 isLoaded / renderPipeline / material_uniforms / bindingResources。
 * renderPipeline。通过 registerLogic('DebugShadowMapMaterial', DebugShadowMapMaterialLogic)
 * 注册，调用方用 `logic(material)` 获取实例。
 */
export class DebugShadowMapMaterialLogic extends MaterialLogic
{
    #uniforms: () => DebugShadowMapUniforms;
    #renderPipeline: RenderPipeline;
    #bindingResources: Computed<Record<string, import('@feng3d/webgpu').BindingResource>>;

    protected constructor(data: DebugShadowMapMaterial)
    {
        super(data);
        const r_material = reactive(data);
        this.#uniforms = () => r_material.uniforms ?? { u_texSize: { x: 1024, y: 1024 } };
        const s_texture = () => r_material.s_texture ?? getDefaultDepthTexture();

        this.#renderPipeline = reactive({
            vertex: { wgsl: textureVertexWGSL },
            fragment: { wgsl: debugShadowMapFragmentWGSL, targets: [{}] },
            // 不剔除：调试平面两面都要可见（Billboard 旋转后法线可能翻转）
            primitive: { topology: 'triangle-list', cullFace: 'none', frontFace: 'ccw' },
            // 调试平面不需要深度写入/测试，始终覆盖
            depthStencil: { depthWriteEnabled: false, depthCompare: 'always' },
        }) as RenderPipeline;

        // 纹理绑定（纯 computed）：字段变化时精确失效。
        // 纹理视图缓存：同一 Texture 复用同一 TextureView（稳定引用，避免 GPU 纹理重建）。
        const viewCache = new Map<unknown, TextureView>();
        this.#bindingResources = computed(() =>
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
            result.s_texture = view;
            // 普通采样器（textureLoad 不使用采样器，但 binding 槽位需要填充）
            result.s_textureSampler = DEFAULT_SAMPLER;

            return result;
        });
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: DebugShadowMapMaterial): DebugShadowMapMaterialLogic
    {
        return new DebugShadowMapMaterialLogic(data);
    }

    beforeRender(renderObject: RenderObject): void
    {
        writeMaterialBase(renderObject, this.#renderPipeline, this.#uniforms);
        writeTextureBindings(renderObject, this.#bindingResources.value);
    }
}

registerLogic('DebugShadowMapMaterial', DebugShadowMapMaterialLogic as unknown as new (data: DebugShadowMapMaterial) => DebugShadowMapMaterialLogic);

// ============================================================================
// 阴影图调试顶点着色器 WGSL
//
// 直接复用纹理顶点变换（标准顶点变换 + uv 传递）。
// 顶点输入：
// - @location(0) a_position
// - @location(3) a_uv
//
// 注意：本材质与 TextureMaterial 各自内联一份独立的 vertex WGSL，不共享。
const textureVertexWGSL = `
struct VertexInput {
    @location(0) a_position: vec3<f32>,
    @location(3) a_uv: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}
` + transformUniformsWGSL + cameraUniformsWGSL + `
@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.a_position, 1.0);
    output.position = cameraUniforms.u_viewProjection * worldPosition;
    output.uv = input.a_uv;
    return output;
}
`;

// ============================================================================
// 阴影图调试片段着色器
//
// 配合 textureVertexWGSL 使用（顶点输出 @location(0) uv）。
// 用 textureLoad 读取 depth 纹理的原始深度值（[0,1]），可视化输出为灰度。
//
// 可视化：clearValue=1.0（无物体区域 → 白色），物体区域深度小 → 偏暗。
//
// 绑定约定（与 TextureMaterial 一致）：
// - @group(0) @binding(3) material_uniforms - { u_texSize: vec2 }
// - @group(1) @binding(0) s_textureSampler: sampler（占位，textureLoad 不使用）
// - @group(1) @binding(1) s_texture: texture_depth_2d
const debugShadowMapFragmentWGSL = `
struct FragmentInput {
    @location(0) uv: vec2<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct DebugUniforms {
    u_texSize: vec2<f32>,
}

@group(0) @binding(3) var<uniform> material_uniforms: DebugUniforms;

@group(1) @binding(0) var s_textureSampler: sampler;
@group(1) @binding(1) var s_texture: texture_depth_2d;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    // uv → 整数 texel 坐标（textureLoad 需要 vec2<u32>）
    // 翻转 Y（WebGPU 纹理 V=0 在顶部）
    let flippedUv = vec2<f32>(input.uv.x, 1.0 - input.uv.y);
    let texel = vec2<u32>(
        u32(clamp(flippedUv.x, 0.0, 1.0) * (material_uniforms.u_texSize.x - 1.0)),
        u32(clamp(flippedUv.y, 0.0, 1.0) * (material_uniforms.u_texSize.y - 1.0))
    );

    // textureLoad 读取深度（depth 纹理返回 ∈ [0,1]）
    var depth = textureLoad(s_texture, texel, 0);

    // 安全钳制
    if (!(depth >= 0.0)) { depth = 0.0; }
    if (!(depth <= 1.0)) { depth = 1.0; }

        // 可视化：深度直接作为灰度
    output.color = vec4<f32>(depth, depth, depth, 1.0);

    return output;
}
`;
