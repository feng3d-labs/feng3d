declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SegmentMaterial: MaterialLogic;
    }
}

import type { Color4 } from '../core/Color4';
import { RenderObject, RenderPipeline } from '@feng3d/webgpu';
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { Material, MaterialLogic, writeMaterialBase } from './Material';
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
 * SegmentMaterial logic：填入 segment 着色器，line-list 拓扑、不剔除、开启 alpha 混合。
 *
 * class 实现：暴露 isLoaded / renderPipeline / material_uniforms / bindingResources。
 * renderPipeline。通过 registerLogic('SegmentMaterial', SegmentMaterialLogic) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
/**
 * SegmentMaterial 逻辑类：线段着色器（顶点颜色 × u_segmentColor，alpha 混合）。
 */
export class SegmentMaterialLogic extends MaterialLogic
{
    #uniforms: () => SegmentUniforms;
    #renderPipeline: RenderPipeline;

    protected constructor(data: SegmentMaterial)
    {
        super(data);
        const r_material = reactive(data);
        this.#uniforms = () => r_material.uniforms ?? { u_segmentColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } };

        this.#renderPipeline = reactive({
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
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: SegmentMaterial): SegmentMaterialLogic
    {
        return new SegmentMaterialLogic(data);
    }

    /** 半透明（alpha 混合启用），供渲染排序/分组/阴影筛选查询 */
    get isTransparent(): boolean
    {
        return true;
    }

    /** 线段拓扑（line-list），不参与面片处理 */
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
registerLogic('SegmentMaterial', SegmentMaterialLogic as unknown as new (data: SegmentMaterial) => SegmentMaterialLogic);

// 注册默认材质工厂（由 Material.ts 的 ensureDefaultMaterials 惰性调用）

// ============================================================================
// 线段顶点着色器 WGSL
//
// 与颜色顶点着色器一致（position + color），仅着色器名不同以便材质区分。
//
// 线段顶点着色器代码
const segmentVertexWGSL = `
struct VertexInput {
    @location(0) a_position: vec3<f32>,
    @location(1) a_color: vec4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}
` + transformUniformsWGSL + cameraUniformsWGSL + `
@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.a_position, 1.0);
    output.position = cameraUniforms.u_viewProjection * worldPosition;
    output.color = input.a_color;
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
    // 顶点色与材质色相乘；透明度取顶点色。
    //
    // 不能写 input.color * material_uniforms.u_segmentColor：实测材质 uniform 的**第 4 个
    // 分量（alpha）传到 GPU 后恒为 0**（rgb 正常），相乘会让整条线段 alpha=0 而完全不可见
    //（单独输出 uniform、单独输出顶点色都正常，说明问题只出在 uniform 的 alpha 分量）。
    // 这里改用逐分量书写并让 alpha 取顶点色，规避该问题。
    output.color = vec4<f32>(
        input.color.r * material_uniforms.u_segmentColor.r,
        input.color.g * material_uniforms.u_segmentColor.g,
        input.color.b * material_uniforms.u_segmentColor.b,
        input.color.a,
    );
    return output;
}
`;
