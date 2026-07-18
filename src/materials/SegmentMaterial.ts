import type { Color4 } from '../core/Color4';
import { Material, MaterialLogic, registerDefaultMaterialFactory } from './Material';
import { reactive, registerLogic } from '@feng3d/reactivity';

declare module './Material'
{
    export interface MaterialMap
    {
        SegmentMaterial: SegmentMaterial;
    }
}

/**
 * 线段材质 uniforms（颜色）。
 */
export interface SegmentUniforms
{
    /** 颜色 */
    readonly u_segmentColor: Color4;
}

/**
 * 线段材质（纯数据接口）。
 *
 * 使用 segment 着色器（顶点颜色 × 材质颜色），按线段列表（line-list）拓扑绘制，
 * 开启 alpha 混合。shader 与渲染状态由 materialLogic 在创建时填充到 renderPipeline。
 */
export interface SegmentMaterial extends Material
{
    readonly __type__: 'SegmentMaterial';
    readonly uniforms: SegmentUniforms;
}

/**
 * 创建 SegmentMaterial 实例。
 */
export function createSegmentMaterial(): SegmentMaterial
{
    return {
        __type__: 'SegmentMaterial',
        name: '',
        uniforms: { u_segmentColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
    };
}

// 注册默认值（缺失字段自动填充）
registerLogic('SegmentMaterial', undefined, {
    name: '',
    uniforms: { u_segmentColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
});

/**
 * SegmentMaterial logic：填入 segment 着色器，line-list 拓扑、不剔除、开启 alpha 混合。
 */
export class SegmentMaterialLogic extends MaterialLogic
{
    constructor(material: SegmentMaterial)
    {
        super(material);
        reactive(this.renderPipeline.vertex).wgsl = segmentVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = segmentFragmentWGSL;
        reactive(this.renderPipeline.primitive).topology = 'line-list';
        reactive(this.renderPipeline.primitive).cullFace = 'none';
        // 开启 alpha 混合
        reactive(this.renderPipeline.fragment).targets = [{
            blend: {
                color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            },
        }];
    }
}

// 注册到 logic 分发表
registerLogic('SegmentMaterial', SegmentMaterialLogic);

// 注册默认材质工厂（由 Material.ts 的 ensureDefaultMaterials 惰性调用）
registerDefaultMaterialFactory('Segment-Material', createSegmentMaterial);

// ============================================================================
// 线段顶点着色器 WGSL
//
// 与颜色顶点着色器一致（position + color），仅着色器名不同以便材质区分。
//
// 线段顶点着色器代码
const segmentVertexWGSL = `
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
// 线段片段着色器 WGSL
//
// 用材质 u_segmentColor 与顶点颜色相乘输出。
//
// 绑定约定：
// - @group(0) @binding(3) var<uniform> material_uniforms - { u_segmentColor: vec4 }（SegmentUniforms）
//
// 线段片段着色器代码
const segmentFragmentWGSL = `
struct FragmentInput {
    @location(0) color: vec4<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct SegmentUniforms {
    u_segmentColor: vec4<f32>,
}

@group(0) @binding(3) var<uniform> material_uniforms: SegmentUniforms;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = input.color * material_uniforms.u_segmentColor;
    return output;
}
`;
