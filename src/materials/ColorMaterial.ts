import { reactive, registerLogic } from '@feng3d/reactivity';
import { RenderObject, RenderPipeline } from '@feng3d/webgpu';
import type { Color4 } from '../core/Color4';
import { Material, MaterialLogic } from './Material';

// 触发 materialLogic 注册（ColorMaterial 工厂 + 默认材质）
import './Material';

declare module './Material'
{
    export interface MaterialMap
    {
        ColorMaterial: ColorMaterial;
    }
}

/**
 * ColorMaterial uniforms（漫反射颜色）。
 */
export interface ColorUniforms
{
    /**
     * 漫反射颜色（纯数据 Color4）。
     *
     * 修改任一分量（如 `reactive(mat.uniforms.u_diffuseInput).r = 0.5`）
     * 会被响应式系统捕获，实时更新到 GPU。
     */
    readonly u_diffuseInput: Color4;
}

/**
 * 颜色材质（纯数据接口）。
 *
 * 使用 color 着色器（顶点颜色 × 漫反射颜色）。shader 与渲染状态由 materialLogic 在
 * 创建时填充到 renderPipeline。漫反射颜色直接作为 uniforms.u_diffuseInput。
 */
export interface ColorMaterial extends Material
{
    readonly __type__: 'ColorMaterial';
    readonly uniforms: ColorUniforms;
}

// 注册默认值（缺失字段自动填充）
// uniforms 为纯数据 Color4 字面量，applyDefaults 浅拷贝（{...}）后各实例独立。
registerLogic('ColorMaterial', undefined, {
    name: '',
    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
    samplers: {},
    textureViews: {},
    externalTextures: {},
});

/**
 * ColorMaterial logic：填入 color 着色器。
 */
export class ColorMaterialLogic extends MaterialLogic
{
    readonly renderPipeline: RenderPipeline;

    constructor(material: ColorMaterial)
    {
        super(material);
        this.renderPipeline = reactive({
            vertex: { wgsl: colorWGSL },
            fragment: { wgsl: colorWGSL, targets: [{}] },
            primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'cw' },
            depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
        });
    }

    beforeRender(renderObject: RenderObject): void
    {
        reactive(renderObject).pipeline = this.renderPipeline;
        super.beforeRender(renderObject);
    }
}

// 注册到 logic 分发表
registerLogic('ColorMaterial', ColorMaterialLogic);

/**
 * 颜色顶点着色器代码
 */
const colorWGSL = `
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) color: vec4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
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
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.position, 1.0);
    output.position = cameraUniforms.u_viewProjection * worldPosition;
    output.color = input.color;
    return output;
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct ColorUniforms {
    u_diffuseInput: vec4<f32>,
}

@group(0) @binding(3) var<uniform> material_uniforms: ColorUniforms;

@fragment
fn fragment(input: VertexOutput) -> FragmentOutput {
    var output: FragmentOutput;
    // 顶点颜色与材质颜色相乘
    output.color = input.color * material_uniforms.u_diffuseInput;
    return output;
}
`;