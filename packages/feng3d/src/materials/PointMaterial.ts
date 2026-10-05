declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PointMaterial: MaterialLogic;
    }
}

import type { Color4 } from '../core/Color4';
import { RenderPipeline } from '@feng3d/webgpu';
import { getPointShaderWGSL } from '../shaders/tsl/pointMaterial';
import { Material, MaterialLogic, materialLogic, writeMaterialBase } from './Material';
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
 * 通过 registerLogic('PointMaterial', pointMaterial) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
export interface PointMaterialLogic extends MaterialLogic
{
}

/**
 * 工厂函数：PointMaterialLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 材质数据（raw）
 */
export function pointMaterialLogic(data: PointMaterial): PointMaterialLogic
{
    const r_material = reactive(data);
    // uniforms 兜底：逐字段补齐（不能只判断 uniforms 整体是否存在——
    // 调用方可能只声明了部分字段，缺字段会让 WGPUBufferBinding 取不到值、
    // 打印「没有找到 统一块变量属性 …」并放弃上传，GPU 侧该字段恒为 0）
    const uniforms = () =>
    {
        const uniforms = r_material.uniforms;

        return {
            ...uniforms,
            u_color: uniforms?.u_color ?? { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
            u_PointSize: uniforms?.u_PointSize ?? 1,
        };
    };
    const depthWrite = () => r_material.depthWrite ?? true; // 缺省沿用该材质原默认值（issue #157）

    // TSL 构建的着色器（首次调用时构建并缓存，见 shaders/tsl/pointMaterial.ts）
    const shaderWGSL = getPointShaderWGSL();

    const renderPipeline = reactive({
        vertex: { wgsl: shaderWGSL.vertex },
        fragment: { wgsl: shaderWGSL.fragment, targets: [{}] },
        primitive: { topology: 'triangle-list', cullFace: 'none', frontFace: 'ccw' },
        depthStencil: { depthWriteEnabled: depthWrite(), depthCompare: 'less' },
    }) as RenderPipeline;

    // 组合基类工厂：未覆写的成员显式委托（不要用 ...base 展开——会把 getter 立刻求值）
    const base = materialLogic(data);

    const logic: PointMaterialLogic = {
        get isTransparent() { return base.isTransparent; },
        /** 点拓扑（triangle-list 展开但语义为点），不参与面片处理 */
        get isPrimitivesTopology() { return false; },
        get isLoaded() { return base.isLoaded; },
        beforeRender(renderObject) { writeMaterialBase(renderObject, renderPipeline, uniforms); },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('PointMaterial', pointMaterialLogic);
