import { BufferBinding, RenderObject, RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { Material, MaterialLogic } from './Material';
import { reactive, effect, registerLogic } from '@feng3d/reactivity';

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
 * 创建 DebugShadowMapMaterial 实例。
 */
export function createDebugShadowMapMaterial(): DebugShadowMapMaterial
{
    return {
        __type__: 'DebugShadowMapMaterial',
        name: '',
        uniforms: { u_texSize: { x: 1024, y: 1024 } },
        s_texture: getDefaultDepthTexture(),
    };
}

/**
 * DebugShadowMapMaterial logic：填入调试着色器，监听 s_texture 变化重算绑定。
 *
 * 函数式实现：构造逻辑变为闭包变量，仅暴露 isLoaded / onLoadCompleted / beforeRender /
 * renderPipeline。通过 registerLogic('DebugShadowMapMaterial', debugShadowMapMaterialLogic)
 * 注册，调用方用 `logic(material)` 获取实例。
 */
function debugShadowMapMaterialLogic(material: DebugShadowMapMaterial): MaterialLogic
{
    // 默认值（缺失字段单独赋值）
    const writable = material as { [k: string]: any };
    if (material.name === undefined) writable.name = '';
    if (material.uniforms === undefined)
    {
        writable.uniforms = { u_texSize: { x: 1024, y: 1024 } };
    }
    if (material.s_texture === undefined) writable.s_texture = getDefaultDepthTexture();

    const _material = material;
    const renderPipeline = reactive({
        vertex: { wgsl: textureVertexWGSL },
        fragment: { wgsl: debugShadowMapFragmentWGSL, targets: [{}] },
        // 不剔除：调试平面两面都要可见（BillboardComponent 旋转后法线可能翻转）
        primitive: { topology: 'triangle-list', cullFace: 'none', frontFace: 'cw' },
        // 调试平面不需要深度写入/测试，始终覆盖
        depthStencil: { depthWriteEnabled: false, depthCompare: 'always' },
    }) as RenderPipeline;

    // 纹理绑定缓存（key → textureView + sampler），beforeRender 时写入 bindingResources
    const _textureBindings: Record<string, { textureView: TextureView, sampler: Sampler }> = {};

    const updateTexture = () =>
    {
        // depth 纹理用 depth-only aspect 的 view（texture_depth_2d 要求）
        _textureBindings.s_texture = {
            textureView: {
                texture: material.s_texture as unknown as TextureView['texture'],
                aspect: 'depth-only',
            },
            // 普通采样器（textureLoad 不使用采样器，但 binding 槽位需要填充）
            sampler: DEFAULT_SAMPLER,
        };
    };
    effect(updateTexture);

    function beforeRender(renderObject: RenderObject): void
    {
        reactive(renderObject).pipeline = renderPipeline;
        if (!renderObject.bindingResources) reactive(renderObject).bindingResources = {} as any;
        const bindingResources = renderObject.bindingResources;
        if (!bindingResources.material_uniforms)
        {
            reactive(bindingResources).material_uniforms = { value: {} };
        }
        reactive(bindingResources.material_uniforms as BufferBinding).value = _material.uniforms;
        const r_bindingResources = reactive(renderObject.bindingResources);
        for (const key in _textureBindings)
        {
            const binding = _textureBindings[key];
            r_bindingResources[key] = binding.textureView;
            r_bindingResources[`${key}Sampler`] = binding.sampler;
        }
    }

    return {
        renderPipeline,
        isLoaded: true,
        onLoadCompleted: (callback) => callback(),
        beforeRender,
    };
}

registerLogic('DebugShadowMapMaterial', debugShadowMapMaterialLogic);

// ============================================================================
// 阴影图调试顶点着色器 WGSL
//
// 直接复用纹理顶点变换（标准顶点变换 + uv 传递）。
// 顶点输入：
// - @location(0) position
// - @location(3) uv
//
// 注意：本材质与 TextureMaterial 各自内联一份独立的 vertex WGSL，不共享。
const textureVertexWGSL = `
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(3) uv: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}
` + transformUniformsWGSL + cameraUniformsWGSL + `
@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.position, 1.0);
    output.position = cameraUniforms.u_viewProjection * worldPosition;
    output.uv = input.uv;
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
