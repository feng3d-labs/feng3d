import { Color4 } from '@feng3d/math';
import { Material } from './Material';
import { registerDefaults } from '../core/logic';

/**
 * 线段材质 uniforms（颜色）。
 */
export interface SegmentUniforms
{
    /** 颜色 */
    u_segmentColor: Color4;
}

/**
 * 线段材质（纯数据接口）。
 *
 * 使用 segment 着色器（顶点颜色 × 材质颜色），按线段列表（line-list）拓扑绘制，
 * 开启 alpha 混合。shader 与渲染状态由 materialLogic 在创建时填充到 renderPipeline。
 */
export interface SegmentMaterial extends Material
{
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
        uniforms: { u_segmentColor: new Color4() },
        samplers: {},
        textureViews: {},
        externalTextures: {},
    };
}

// 注册默认值（缺失字段自动填充）
registerDefaults('SegmentMaterial', {
    name: '',
    uniforms: { u_segmentColor: new Color4() },
    samplers: {},
    textureViews: {},
    externalTextures: {},
});
