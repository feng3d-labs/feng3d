import { Texture, TextureView } from '@feng3d/webgpu';
import { Material, MaterialLogic } from './Material';
import { reactive, effect, registerLogic } from '@feng3d/reactivity';
import { buildSampler } from '../render/webgpu/MaterialPipeline';

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
        samplers: {},
        textureViews: {},
        externalTextures: {},
        s_texture: getDefaultDepthTexture(),
    };
}

registerLogic('DebugShadowMapMaterial', undefined, {
    name: '',
    uniforms: { u_texSize: { x: 1024, y: 1024 } },
    samplers: {},
    textureViews: {},
    externalTextures: {},
    s_texture: getDefaultDepthTexture(),
});

/**
 * DebugShadowMapMaterial logic：填入调试着色器，监听 s_texture 变化重算绑定。
 */
export class DebugShadowMapMaterialLogic extends MaterialLogic
{
    constructor(material: DebugShadowMapMaterial)
    {
        super(material);
        reactive(this.renderPipeline.vertex).wgsl = textureVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = debugShadowMapFragmentWGSL;
        reactive(this.renderPipeline.primitive).topology = 'triangle-list';
        // 不剔除：调试平面两面都要可见（BillboardComponent 旋转后法线可能翻转）
        reactive(this.renderPipeline.primitive).cullFace = 'none';
        reactive(this.renderPipeline.primitive).frontFace = 'cw';
        // 调试平面不需要深度写入/测试，始终覆盖
        reactive(this.renderPipeline.depthStencil).depthWriteEnabled = false;
        reactive(this.renderPipeline.depthStencil).depthCompare = 'always';

        const updateTexture = () =>
        {
            // depth 纹理用 depth-only aspect 的 view（texture_depth_2d 要求）
            material.textureViews.s_texture = {
                texture: material.s_texture as unknown as TextureView['texture'],
                aspect: 'depth-only',
            };
            // 普通采样器（textureLoad 不使用采样器，但 binding 槽位需要填充）
            material.samplers.s_textureSampler = buildSampler(material.s_texture);
        };
        effect(updateTexture);
    }

    get isLoaded() { return true; }

    onLoadCompleted(callback: () => void): void { callback(); }
}

registerLogic('DebugShadowMapMaterial', DebugShadowMapMaterialLogic);

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

struct TransformUniforms {
    u_modelMatrix: mat4x4<f32>,
    u_ITModelMatrix: mat4x4<f32>,
}

struct CameraUniforms {
    u_projectionMatrix: mat4x4<f32>,
    u_viewProjection: mat4x4<f32>,
    u_viewMatrix: mat4x4<f32>,
    u_cameraMatrix: mat4x4<f32>,
    u_cameraPos: vec3<f32>,
    u_skyBoxSize: f32,
    u_scaleByDepth: f32,
}

@group(0) @binding(0) var<uniform> transform: TransformUniforms;
@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;

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
