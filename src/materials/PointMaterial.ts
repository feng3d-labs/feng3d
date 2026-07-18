import type { Color4 } from '../core/Color4';
import { Material, MaterialLogic } from './Material';
import { reactive, registerLogic } from '@feng3d/reactivity';

declare module './Material'
{
    export interface MaterialMap
    {
        PointMaterial: PointMaterial;
    }
}

/**
 * 点材质 uniforms（颜色）。
 */
export interface PointUniforms
{
    /** 颜色 */
    readonly u_color: Color4;
}

/**
 * 点材质（纯数据接口）。
 *
 * 使用 point 着色器（顶点颜色 × 材质颜色），按点列表（point-list）拓扑绘制。
 * shader 与渲染状态由 materialLogic 在创建时填充到 renderPipeline。
 */
export interface PointMaterial extends Material
{
    readonly __type__: 'PointMaterial';
    readonly uniforms: PointUniforms;
}

/**
 * 创建 PointMaterial 实例。
 */
export function createPointMaterial(): PointMaterial
{
    return {
        __type__: 'PointMaterial',
        name: '',
        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
    };
}

// 注册默认值（缺失字段自动填充）
registerLogic('PointMaterial', undefined, {
    name: '',
    uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
});

/**
 * PointMaterial logic：填入 point 着色器，point-list 拓扑、不剔除。
 */
export class PointMaterialLogic extends MaterialLogic
{
    constructor(material: PointMaterial)
    {
        super(material);
        reactive(this.renderPipeline.vertex).wgsl = pointVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = pointFragmentWGSL;
        reactive(this.renderPipeline.primitive).topology = 'point-list';
        reactive(this.renderPipeline.primitive).cullFace = 'none';
    }
}

// 注册到 logic 分发表
registerLogic('PointMaterial', PointMaterialLogic);

// ============================================================================
// 点顶点着色器 WGSL
//
// 顶点输入（与 core Geometry 的 a_* 属性经 MaterialPipeline 名称映射后一致）：
// - @location(0) position
// - @location(1) color
//
// 注意：WebGPU 不支持顶点着色器输出点大小（无 gl_PointSize 等价物），
// 点大小由 pipeline / GPU 默认（1 像素）。u_PointSize 仅作为 uniform 占位，
// 供未来通过实例化或 geometry 扩展实现可变点大小时使用。
//
// 点顶点着色器代码
const pointVertexWGSL = `
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
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.position, 1.0);
    output.position = cameraUniforms.u_viewProjection * worldPosition;
    output.color = input.color;
    return output;
}
`;

// ============================================================================
// 点片段着色器 WGSL
//
// 用材质 u_color 与顶点颜色相乘输出。
//
// 绑定约定：
// - @group(0) @binding(3) var<uniform> material_uniforms - { u_color: vec4 }（PointUniforms）
//
// 点片段着色器代码
const pointFragmentWGSL = `
struct FragmentInput {
    @location(0) color: vec4<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct PointUniforms {
    u_color: vec4<f32>,
}

@group(0) @binding(3) var<uniform> material_uniforms: PointUniforms;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = input.color * material_uniforms.u_color;
    return output;
}
`;
