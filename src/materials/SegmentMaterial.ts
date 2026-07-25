import type { Color4 } from '../core/Color4';
import { BufferBinding, RenderObject, RenderPipeline } from '@feng3d/webgpu';
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { Material, MaterialLogic, registerDefaultMaterialFactory } from './Material';
import { reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';

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
 * SegmentMaterial logic：填入 segment 着色器，line-list 拓扑、不剔除、开启 alpha 混合。
 *
 * 函数式实现：构造逻辑变为闭包变量，仅暴露 isLoaded / onLoadCompleted / beforeRender /
 * renderPipeline。通过 registerLogic('SegmentMaterial', segmentMaterialLogic) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
function segmentMaterialLogic(material: SegmentMaterial): MaterialLogic
{
    // 默认值（缺失字段单独赋值）
    const writable = material as UnReadonly<SegmentMaterial>;
    if (material.name === undefined) writable.name = '';
    if (material.uniforms === undefined)
    {
        writable.uniforms = { u_segmentColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } };
    }

    const _material = material;
    const renderPipeline = reactive({
        vertex: { wgsl: segmentVertexWGSL },
        fragment: {
            wgsl: segmentFragmentWGSL,
            // 开启 alpha 混合
            targets: [{
                blend: {
                    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                    alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                },
            }],
        },
        primitive: { topology: 'line-list', cullFace: 'none', frontFace: 'ccw' },
        depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
    }) as RenderPipeline;

    function beforeRender(renderObject: RenderObject): void
    {
        reactive(renderObject).pipeline = renderPipeline;
        if (!renderObject.bindingResources) reactive(renderObject).bindingResources = {};
        const bindingResources = renderObject.bindingResources;
        if (!bindingResources.material_uniforms)
        {
            reactive(bindingResources).material_uniforms = { value: {} };
        }
        reactive(bindingResources.material_uniforms as BufferBinding).value = _material.uniforms;
    }

    return {
        get renderPipeline() { return renderPipeline; },
        get isLoaded() { return true; },
        onLoadCompleted: (callback) => callback(),
        beforeRender,
    };
}

// 注册到 logic 分发表
registerLogic('SegmentMaterial', segmentMaterialLogic);

// 注册默认材质工厂（由 Material.ts 的 ensureDefaultMaterials 惰性调用）
registerDefaultMaterialFactory('Segment-Material', () => ({ __type__: 'SegmentMaterial' }));

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
` + transformUniformsWGSL + cameraUniformsWGSL + `
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
