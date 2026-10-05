declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ColorMaterial: MaterialLogic;
    }
}

import { reactive, registerLogic } from '@feng3d/reactivity';
import { RenderPipeline } from '@feng3d/webgpu';
import type { Color4 } from '../core/Color4';
import { getColorShaderWGSL } from '../shaders/tsl/colorMaterial';
import { Material, MaterialLogic, materialLogic, writeMaterialBase } from './Material';

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
    /**
     * 是否写入深度缓冲（缺省取该材质原默认值）。
     *
     * 关闭后该材质的片元不更新深度，常用于图标 / 辅助线 / 描边等不希望互相遮挡、
     * 也不希望挡住场景的绘制（见 issue #157）。
     */
    readonly depthWrite?: boolean;
}

/**
 * ColorMaterial 逻辑类：填入 color 着色器。
 *
 * 通过 registerLogic('ColorMaterial', colorMaterial) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
export interface ColorMaterialLogic extends MaterialLogic
{
}

/**
 * 工厂函数：ColorMaterialLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 材质数据（raw）
 */
export function colorMaterialLogic(data: ColorMaterial): ColorMaterialLogic
{
    // 默认值 accessor（uniforms 为纯数据 Color4 字面量，每次新建避免共享引用）
    const r_material = reactive(data);
    // uniforms 兜底：逐字段补齐（不能只判断 uniforms 整体是否存在——调用方可能只声明了
    // 部分字段，缺字段会让 WGPUBufferBinding 取不到值并放弃上传，GPU 侧该字段恒为 0）
    const uniforms = () => (r_material.uniforms?.u_diffuseInput
        ? r_material.uniforms
        : {
            ...r_material.uniforms,
            u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        });
    const depthWrite = () => r_material.depthWrite ?? true; // 缺省沿用该材质原默认值（issue #157）

    // TSL 构建的着色器（首次调用时构建并缓存，见 shaders/tsl/colorMaterial.ts）
    const shaderWGSL = getColorShaderWGSL();

    const renderPipeline = reactive({
        vertex: { wgsl: shaderWGSL.vertex },
        fragment: { wgsl: shaderWGSL.fragment, targets: [{}] },
        primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'ccw' },
        depthStencil: { depthWriteEnabled: depthWrite(), depthCompare: 'less' },
    }) as RenderPipeline;

    // 组合基类工厂：未覆写的成员显式委托（不要用 ...base 展开——会把 getter 立刻求值）
    const base = materialLogic(data);

    const logic: ColorMaterialLogic = {
        get isTransparent() { return base.isTransparent; },
        get isPrimitivesTopology() { return base.isPrimitivesTopology; },
        get isLoaded() { return base.isLoaded; },
        beforeRender(renderObject) { writeMaterialBase(renderObject, renderPipeline, uniforms); },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('ColorMaterial', colorMaterialLogic);
