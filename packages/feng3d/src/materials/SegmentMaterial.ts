declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SegmentMaterial: MaterialLogic;
    }
}

import type { Color4 } from '../core/Color4';
import { RenderPipeline } from '@feng3d/webgpu';
import { getSegmentShaderWGSL } from '../shaders/tsl/segmentMaterial';
import { Material, MaterialLogic, materialLogic, writeMaterialBase } from './Material';
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
    /**
     * 是否写入深度缓冲（缺省取该材质原默认值）。
     *
     * 关闭后该材质的片元不更新深度，常用于图标 / 辅助线 / 描边等不希望互相遮挡、
     * 也不希望挡住场景的绘制（见 issue #157）。
     */
    readonly depthWrite?: boolean;
}

/**
 * SegmentMaterial logic：填入 segment 着色器，line-list 拓扑、不剔除、开启 alpha 混合。
 *
 * 通过 registerLogic('SegmentMaterial', segmentMaterial) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
/**
 * SegmentMaterial 逻辑类：线段着色器（顶点颜色 × u_segmentColor，alpha 混合）。
 */
export interface SegmentMaterialLogic extends MaterialLogic
{
}

/**
 * 工厂函数：SegmentMaterialLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 材质数据（raw）
 */
export function segmentMaterialLogic(data: SegmentMaterial): SegmentMaterialLogic
{
    const r_material = reactive(data);
    // uniforms 兜底：逐字段补齐（缺字段会让 WGPUBufferBinding 取不到值并放弃上传）
    const uniforms = () => (r_material.uniforms?.u_segmentColor
        ? r_material.uniforms
        : {
            ...r_material.uniforms,
            u_segmentColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        });
    const depthWrite = () => r_material.depthWrite ?? true; // 缺省沿用该材质原默认值（issue #157）

    // TSL 构建的着色器（首次调用时构建并缓存，见 shaders/tsl/segmentMaterial.ts）
    const shaderWGSL = getSegmentShaderWGSL();

    const renderPipeline = reactive({
        vertex: { wgsl: shaderWGSL.vertex },
        fragment: {
            wgsl: shaderWGSL.fragment,
            // 开启 alpha 混合
            targets: [{
                blend: {
                    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                    alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                },
            }],
        },
        primitive: { topology: 'line-list', cullFace: 'none', frontFace: 'ccw' },
        depthStencil: { depthWriteEnabled: depthWrite(), depthCompare: 'less' },
    }) as RenderPipeline;

    // 组合基类工厂：未覆写的成员显式委托（不要用 ...base 展开——会把 getter 立刻求值）
    const base = materialLogic(data);

    const logic: SegmentMaterialLogic = {
        /** 半透明（alpha 混合启用），供渲染排序/分组/阴影筛选查询 */
        get isTransparent() { return true; },
        /** 线段拓扑（line-list），不参与面片处理 */
        get isPrimitivesTopology() { return false; },
        get isLoaded() { return base.isLoaded; },
        beforeRender(renderObject) { writeMaterialBase(renderObject, renderPipeline, uniforms); },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('SegmentMaterial', segmentMaterialLogic);

// 注册默认材质工厂（由 Material.ts 的 ensureDefaultMaterials 惰性调用）
