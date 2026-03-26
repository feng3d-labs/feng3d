import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { shaderlib } from '@feng3d/renderer';
import { Serializable, SerializeProperty } from '@feng3d/serialization';
import { Material } from '../../../core/Material';
import pointFragment from './point.fragment.glsl';
import pointVertex from './point.vertex.glsl';

declare module '../../../core/Material' {
    interface MaterialMap { PointMaterial: PointMaterial }
    interface UniformsMap { PointUniforms: PointUniforms }
}

@Serializable('PointMaterial')
export class PointMaterial extends Material
{
    declare __class__: 'PointMaterial';

    uniforms = new PointUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'point';
        this.drawMode = 'POINTS';
    }
}

@Serializable('PointUniforms')
export class PointUniforms
{
    declare __class__: 'PointUniforms';
    /**
     * 颜色
     */
    @SerializeProperty()
    @oav()
    u_color = new Color4();

    /**
     * 点绘制时点的尺寸
     */
    @SerializeProperty()
    @oav()
    u_PointSize = 1;
}

shaderlib.shaderConfig.shaders.point = {
    vertex: pointVertex,
    fragment: pointFragment,
};
