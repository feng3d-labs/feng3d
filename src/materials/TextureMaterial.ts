import type { Color4 } from '../core/Color4';
import { RenderObject, RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import { defaultTexture } from '../textures/createTexture';
import { Material, MaterialLogic } from './Material';
import { reactive, effect, registerLogic } from '@feng3d/reactivity';
import { buildSampler, buildTextureView } from '../render/webgpu/MaterialPipeline';

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
 */
export interface TextureMaterial extends Material
{
    readonly __type__: 'TextureMaterial';
    readonly uniforms: TextureUniforms;
    /** 纹理 */
    readonly s_texture: Texture;
}

/**
 * 创建 TextureMaterial 实例。
 */
export function createTextureMaterial(): TextureMaterial
{
    return {
        __type__: 'TextureMaterial',
        name: '',
        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
        s_texture: defaultTexture,
    };
}

// 注册默认值（缺失字段自动填充）
registerLogic('TextureMaterial', undefined, {
    name: '',
    uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
    s_texture: defaultTexture,
});

/**
 * TextureMaterial logic：填入 texture 着色器，监听 s_texture 变化重算绑定。
 */
export class TextureMaterialLogic extends MaterialLogic
{
    readonly renderPipeline: RenderPipeline;

    /** 纹理绑定缓存（key → textureView + sampler），beforeRender 时写入 bindingResources */
    private _textureBindings: Record<string, { textureView: TextureView, sampler: Sampler }> = {};

    constructor(material: TextureMaterial)
    {
        super(material);
        this.renderPipeline = reactive({
            vertex: { wgsl: textureVertexWGSL },
            fragment: { wgsl: textureFragmentWGSL, targets: [{}] },
            primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'cw' },
            depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
        });

        const updateTexture = () =>
        {
            this._textureBindings.s_texture = {
                textureView: buildTextureView(material.s_texture),
                sampler: buildSampler(material.s_texture),
            };
        };
        effect(updateTexture);
    }

    beforeRender(renderObject: RenderObject): void
    {
        reactive(renderObject).pipeline = this.renderPipeline;
        super.beforeRender(renderObject);
        const r_bindingResources = reactive(renderObject.bindingResources);
        for (const key in this._textureBindings)
        {
            const binding = this._textureBindings[key];
            r_bindingResources[key] = binding.textureView;
            r_bindingResources[`${key}Sampler`] = binding.sampler;
        }
    }

    get isLoaded()
    {
        // createTextureFromUrl 工厂返回的 Promise 在赋值前已 resolve，数据在 sources 中就绪。
        const texture = (this._material as TextureMaterial).s_texture;

        return !texture || !!texture.sources?.length;
    }

    onLoadCompleted(callback: () => void): void
    {
        // createTextureFromUrl 是 Promise 工厂，加载在创建时完成，无需事件监听。
        callback();
    }
}

// 注册到 logic 分发表
registerLogic('TextureMaterial', TextureMaterialLogic);

// ============================================================================
// 纹理顶点着色器 WGSL
//
// 顶点输入（统一 location 约定）：
// - @location(0) position
// - @location(3) uv
//
// 纹理顶点着色器代码
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
// 纹理片段着色器 WGSL
//
// 采样纹理颜色，与材质 u_color 相乘输出。
//
// 绑定约定：
// - @group(0) @binding(3) var<uniform> material_uniforms        - { u_color: vec4 }（TextureUniforms）
// - @group(1) @binding(0) var s_textureSampler: sampler
// - @group(1) @binding(1) var s_texture: texture_2d<f32>
//
// 注意：sampler 与 texture 的 WGSL 变量名遵循 webgpu 绑定解析约定
// （bindingResources.s_texture = { texture, sampler }）。
//
// 纹理片段着色器代码
const textureFragmentWGSL = `
struct FragmentInput {
    @location(0) uv: vec2<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct TextureUniforms {
    u_color: vec4<f32>,
}

@group(0) @binding(3) var<uniform> material_uniforms: TextureUniforms;

@group(1) @binding(0) var s_textureSampler: sampler;
@group(1) @binding(1) var s_texture: texture_2d<f32>;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    let texColor = textureSample(s_texture, s_textureSampler, input.uv);
    output.color = texColor * material_uniforms.u_color;
    return output;
}
`;
