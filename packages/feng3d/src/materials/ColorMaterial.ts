declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ColorMaterial: MaterialLogic;
    }
}

import { reactive, registerLogic } from '@feng3d/reactivity';
import { RenderObject, RenderPipeline } from '@feng3d/webgpu';
import type { Color4 } from '../core/Color4';
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { Material, MaterialLogic, writeMaterialBase } from './Material';

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

/**
 * ColorMaterial 逻辑类：填入 color 着色器。
 *
 * 通过 registerLogic('ColorMaterial', ColorMaterialLogic) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
export class ColorMaterialLogic extends MaterialLogic
{
    #uniforms: () => ColorUniforms;
    #renderPipeline: RenderPipeline;

    protected constructor(data: ColorMaterial)
    {
        super(data);
        // 默认值 accessor（uniforms 为纯数据 Color4 字面量，每次新建避免共享引用）
        const r_material = reactive(data);
        // uniforms 兜底：逐字段补齐（不能只判断 uniforms 整体是否存在——调用方可能只声明了
        // 部分字段，缺字段会让 WGPUBufferBinding 取不到值并放弃上传，GPU 侧该字段恒为 0）
        this.#uniforms = () => (r_material.uniforms?.u_diffuseInput
            ? r_material.uniforms
            : {
                ...r_material.uniforms,
                u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
            });

        this.#renderPipeline = reactive({
            vertex: { wgsl: colorWGSL },
            fragment: { wgsl: colorWGSL, targets: [{}] },
            primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'ccw' },
            depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
        }) as RenderPipeline;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: ColorMaterial): ColorMaterialLogic
    {
        return new ColorMaterialLogic(data);
    }

    beforeRender(renderObject: RenderObject): void
    {
        writeMaterialBase(renderObject, this.#renderPipeline, this.#uniforms);
    }
}

// 注册到 logic 分发表
registerLogic('ColorMaterial', ColorMaterialLogic as unknown as new (data: ColorMaterial) => ColorMaterialLogic);

/**
 * 颜色顶点着色器代码
 *
 * TransformUniforms / CameraUniforms 由 transformUniformsWGSL / cameraUniformsWGSL 拼接，
 * 避免重复声明（struct 定义在数据源 Object3D.ts / Camera.ts 中维护）。
 */
const colorWGSL = `
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
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.a_position, 1.0);
    output.position = cameraUniforms.u_viewProjection * worldPosition;
    output.color = input.a_color;
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
    // 顶点色与材质色相乘；透明度取顶点色。
    //
    // 不能写 input.color * material_uniforms.u_diffuseInput：实测材质 uniform 的**第 4 个
    // 分量（alpha）传到 GPU 后恒为 0**（rgb 正常），相乘后整个物体渲染为黑色
    //（单独输出 uniform、单独输出顶点色都正常，说明问题只出在 uniform 的 alpha 分量）。
    // 逐分量书写并让 alpha 取顶点色即可规避。
    output.color = vec4<f32>(
        input.color.r * material_uniforms.u_diffuseInput.r,
        input.color.g * material_uniforms.u_diffuseInput.g,
        input.color.b * material_uniforms.u_diffuseInput.b,
        input.color.a,
    );
    return output;
}
`;