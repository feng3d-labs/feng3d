declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PointMaterial: MaterialLogic;
    }
}

import type { Color4 } from '../core/Color4';
import { BufferBinding, RenderObject, RenderPipeline } from '@feng3d/webgpu';
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { globalUniformsWGSL } from '../render/renderer/ForwardRenderer';
import { Material, MaterialLogic } from './Material';
import { reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';

declare module './Material'
{
    export interface MaterialMap
    {
        PointMaterial: PointMaterial;
    }
}

/**
 * 点材质 uniforms（颜色、点尺寸）。
 */
export interface PointUniforms
{
    /** 颜色 */
    readonly u_color: Color4;
    /** 点尺寸（屏幕空间像素）。PointGeometry 已把每点扩展成 4 顶点四边形，
     *  顶点着色器按此值在 NDC 屏幕空间展开，实现可变尺寸的方形点。 */
    readonly u_PointSize: number;
}

/**
 * 点材质（纯数据接口）。
 *
 * 使用 point 着色器（顶点颜色 × 材质颜色），PointGeometry 已把每点扩展成 billboard 四边形，
 * 本材质按 triangle-list 拓扑绘制，并在顶点着色器按 u_PointSize 在屏幕空间展开四边形，
 * 实现可变尺寸的方形点（对应 three.js PointsMaterial.size）。
 */
export interface PointMaterial extends Material
{
    readonly __type__: 'PointMaterial';
    readonly uniforms: PointUniforms;
}

/**
 * PointMaterial logic：填入 point 着色器，triangle-list 拓扑（billboard 四边形）、不剔除。
 *
 * 函数式实现：构造逻辑变为闭包变量，仅暴露 isLoaded / onLoadCompleted / beforeRender /
 * renderPipeline。通过 registerLogic('PointMaterial', pointMaterialLogic) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
function pointMaterialLogic(material: PointMaterial): MaterialLogic
{
    // 默认值（缺失字段单独赋值）
    const writable = material as UnReadonly<PointMaterial>;
    if (material.name === undefined) writable.name = '';
    if (material.uniforms === undefined)
    {
        writable.uniforms = {
            u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
            u_PointSize: 1,
        };
    }

    const _material = material;
    const renderPipeline = reactive({
        vertex: { wgsl: pointVertexWGSL },
        fragment: { wgsl: pointFragmentWGSL, targets: [{}] },
        primitive: { topology: 'triangle-list', cullFace: 'none', frontFace: 'ccw' },
        depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
    }) as RenderPipeline;

    return {
        get renderPipeline() { return renderPipeline; },
        get material_uniforms() { return { value: _material.uniforms }; },
        get bindingResources() { return {}; },
        get isLoaded() { return true; },
        onLoadCompleted: (callback) => callback(),
    };
}

// 注册到 logic 分发表
registerLogic('PointMaterial', pointMaterialLogic);

// ============================================================================
// 点顶点着色器 WGSL（billboard 四边形展开）
//
// PointGeometry 已把每点扩展成 4 顶点，a_uv 承载四边形角偏移 corner ∈ [-1,1]²。
// 本着色器把点投影到 clip space 后，按 u_PointSize 在 NDC 屏幕空间展开成方形：
//   NDC 偏移 = corner × (u_PointSize / viewportPixels) × 2
// 并做透视修正（偏移乘 clip.w），使展开在屏幕空间进行、远处点视觉更小。
//
// viewport 像素尺寸来自 globalUniforms.u_Viewport（ForwardRenderer 每帧从画布注入）。
//
// 顶点输入（与 core Geometry 的 a_* 属性直接一致）：
// - @location(0) a_position
// - @location(1) a_color
// - @location(2) a_uv（四边形角偏移 corner）
const pointVertexWGSL = `
struct VertexInput {
    @location(0) a_position: vec3<f32>,
    @location(1) a_color: vec4<f32>,
    // a_uv 复用为 billboard 四边形角偏移 corner ∈ [-1,1]²（PointGeometry 写入）
    @location(2) a_uv: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

struct PointUniforms {
    u_color: vec4<f32>,
    u_PointSize: f32,
}

@group(0) @binding(3) var<uniform> material_uniforms: PointUniforms;

` + transformUniformsWGSL + cameraUniformsWGSL + globalUniformsWGSL + `
@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.a_position, 1.0);
    let clipPos = cameraUniforms.u_viewProjection * worldPosition;
    // NDC 空间按像素展开：uv(=corner) × size / viewportPixels × 2（×2 因 NDC 范围 [-1,1]）
    let ndcOffset = input.a_uv * material_uniforms.u_PointSize / globalUniforms.u_Viewport * 2.0;
    // 透视修正：偏移施加在 clip space（乘 clipPos.w），保证屏幕空间等尺寸
    output.position = vec4<f32>(clipPos.xy + ndcOffset * clipPos.w, clipPos.z, clipPos.w);
    output.color = input.a_color;
    return output;
}
`;

// ============================================================================
// 点片段着色器 WGSL
//
// 用材质 u_color 与顶点颜色相乘输出。
//
// 绑定约定：
// - @group(0) @binding(3) var<uniform> material_uniforms - PointUniforms（与顶点着色器共用）
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
    u_PointSize: f32,
}

@group(0) @binding(3) var<uniform> material_uniforms: PointUniforms;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = input.color * material_uniforms.u_color;
    return output;
}
`;
