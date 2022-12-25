import { Color4 } from '../../../math/Color4';
import { oav } from '../../../objectview/ObjectView';
import { shaderlib } from '../../../renderer/shader/ShaderLib';
import { Serializable } from '../../../serialization/Serializable';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { Material } from '../Material';
import pointFragment from './point_fragment_glsl';
import pointVertex from './point_vertex_glsl';

declare global
{
    interface MixinsMaterialMap
    {
        point: PointMaterial
    }
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
        this.renderParams.renderMode = 'POINTS';
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
    cls: PointUniforms
};
