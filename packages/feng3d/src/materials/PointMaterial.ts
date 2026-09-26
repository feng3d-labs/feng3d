declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PointMaterial: MaterialLogic;
    }
}

import type { Color4 } from '../core/Color4';
import { RenderObject, RenderPipeline } from '@feng3d/webgpu';
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { globalUniformsWGSL } from '../render/renderer/ForwardRenderer';
import { Material, MaterialLogic, writeMaterialBase } from './Material';
import { reactive, registerLogic } from '@feng3d/reactivity';

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
    /**
     * 是否写入深度缓冲（缺省取该材质原默认值）。
     *
     * 关闭后该材质的片元不更新深度，常用于图标 / 辅助线 / 描边等不希望互相遮挡、
     * 也不希望挡住场景的绘制（见 issue #157）。
     */
    readonly depthWrite?: boolean;
}

/**
 * PointMaterial logic：填入 point 着色器，triangle-list 拓扑（billboard 四边形）、不剔除。
 *
 * class 实现：暴露 isLoaded / renderPipeline / material_uniforms / bindingResources。
 * renderPipeline。通过 registerLogic('PointMaterial', PointMaterialLogic) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
export class PointMaterialLogic extends MaterialLogic
{
    #uniforms: () => PointUniforms;
    #renderPipeline: RenderPipeline;

    protected constructor(data: PointMaterial)
    {
        super(data);
        const r_material = reactive(data);
        // uniforms 兜底：逐字段补齐（不能只判断 uniforms 整体是否存在——
        // 调用方可能只声明了部分字段，缺字段会让 WGPUBufferBinding 取不到值、
        // 打印「没有找到 统一块变量属性 …」并放弃上传，GPU 侧该字段恒为 0）

        this.#uniforms = () =>
        {
            const uniforms = r_material.uniforms;

            return {
                ...uniforms,
                u_color: uniforms?.u_color ?? { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                u_PointSize: uniforms?.u_PointSize ?? 1,
            };
        };
        const depthWrite = () => r_material.depthWrite ?? true; // 缺省沿用该材质原默认值（issue #157）


        this.#renderPipeline = reactive({
            vertex: { wgsl: pointVertexWGSL },
            fragment: { wgsl: pointFragmentWGSL, targets: [{}] },
            primitive: { topology: 'triangle-list', cullFace: 'none', frontFace: 'ccw' },
            depthStencil: { depthWriteEnabled: depthWrite(), depthCompare: 'less' },
        }) as RenderPipeline;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: PointMaterial): PointMaterialLogic
    {
        return new PointMaterialLogic(data);
    }

    /** 点拓扑（triangle-list 展开但语义为点），不参与面片处理 */
    get isPrimitivesTopology(): boolean
    {
        return false;
    }

    beforeRender(renderObject: RenderObject): void
    {
        writeMaterialBase(renderObject, this.#renderPipeline, this.#uniforms);
    }
}

// 注册到 logic 分发表
registerLogic('PointMaterial', PointMaterialLogic as unknown as new (data: PointMaterial) => PointMaterialLogic);

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
    output.color = vec4<f32>(input.color.rgb * material_uniforms.u_color.rgb, input.color.a);
    return output;
}
`;
