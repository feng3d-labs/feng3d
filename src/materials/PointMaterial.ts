import type { Color4 } from '../core/Color4';
import { Material, MaterialLogic } from './Material';
import { reactive, registerLogic } from '@feng3d/reactivity';
import { pointFragmentWGSL } from '../shaders/point.fragment.wgsl';
import { pointVertexWGSL } from '../shaders/point.vertex.wgsl';

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
        samplers: {},
        textureViews: {},
        externalTextures: {},
    };
}

// 注册默认值（缺失字段自动填充）
registerLogic('PointMaterial', undefined, {
    name: '',
    uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
    samplers: {},
    textureViews: {},
    externalTextures: {},
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
