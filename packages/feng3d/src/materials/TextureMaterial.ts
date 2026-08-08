declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TextureMaterial: MaterialLogic;
    }
}

import type { Color4 } from '../core/Color4';
import { BufferBinding, RenderObject, RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { defaultTexture } from '../textures/createTexture';
import { Material, MaterialLogic } from './Material';
import { reactive, effect, registerLogic, computed, UnReadonly } from '@feng3d/reactivity';

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
    /** 纹理 */
    readonly s_texture: Texture;
    /** 可选采样器（覆盖默认线性采样器）。省略时用 DEFAULT_SAMPLER（linear + repeat）。 */
    readonly sampler?: Sampler;
}

/**
 * TextureMaterial logic：填入 texture 着色器，监听 s_texture 变化重算绑定。
 *
 * 函数式实现：构造逻辑变为闭包变量，仅暴露 isLoaded / onLoadCompleted / beforeRender /
 * renderPipeline。通过 registerLogic('TextureMaterial', textureMaterialLogic) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
function textureMaterialLogic(material: TextureMaterial): MaterialLogic
{
    // 默认值（缺失字段单独赋值）
    const writable = material as UnReadonly<TextureMaterial>;
    if (material.name === undefined) writable.name = '';
    if (material.uniforms === undefined)
    {
        writable.uniforms = { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } };
    }
    if (material.s_texture === undefined) writable.s_texture = defaultTexture;

    const _material = material;
    const renderPipeline = reactive({
        vertex: { wgsl: textureVertexWGSL },
        fragment: { wgsl: textureFragmentWGSL, targets: [{}] },
        primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'ccw' },
        depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
    }) as RenderPipeline;

    // 纹理绑定缓存（key → textureView + sampler），beforeRender 时写入 bindingResources
    const _textureBindings: Record<string, { textureView: TextureView, sampler: Sampler }> = {};

    const updateTexture = () =>
    {
        _textureBindings.s_texture = {
            textureView: buildTextureView(material.s_texture),
            // sampler 字段优先，省略则用默认线性采样器
            sampler: material.sampler ?? DEFAULT_SAMPLER,
        };
    };
    effect(updateTexture);

    const _bindingResources = computed<Record<string, import('@feng3d/webgpu').BindingResource>>(() =>
    {
        const result: Record<string, import('@feng3d/webgpu').BindingResource> = {};
        for (const key in _textureBindings)
        {
            const binding = _textureBindings[key];
            result[key] = binding.textureView;
            result[`${key}Sampler`] = binding.sampler;
        }

        return result;
    });

    return {
        get renderPipeline() { return renderPipeline; },
        get material_uniforms() { return { value: _material.uniforms }; },
        get bindingResources() { return _bindingResources.value; },
        // createTextureFromUrl 工厂返回的 Promise 在赋值前已 resolve，数据在 sources 中就绪。
        get isLoaded()
        {
            const texture = _material.s_texture;

            return !texture || !!texture.sources?.length;
        },
        // createTextureFromUrl 是 Promise 工厂，加载在创建时完成，无需事件监听。
        onLoadCompleted: (callback) => callback(),
    };
}

// 注册到 logic 分发表
registerLogic('TextureMaterial', textureMaterialLogic);

// ============================================================================
// 纹理顶点着色器 WGSL
//
// 顶点输入（统一 location 约定）：
// - @location(0) a_position
// - @location(3) a_uv
//
// 纹理顶点着色器代码
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
