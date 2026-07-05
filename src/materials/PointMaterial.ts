import { Color4 } from '@feng3d/math';
import { Material } from './Material';

/**
 * 点材质 uniforms（颜色）。
 */
export interface PointUniforms
{
    /** 颜色 */
    u_color: Color4;
}

/**
 * 点材质（纯数据接口）。
 *
 * 使用 point 着色器（顶点颜色 × 材质颜色），按点列表（point-list）拓扑绘制。
 * shader 与渲染状态由 materialLogic 在创建时填充到 renderPipeline。
 */
export interface PointMaterial extends Material
{
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
        uniforms: { u_color: new Color4() },
        samplers: {},
        textureViews: {},
        externalTextures: {},
    };
}
