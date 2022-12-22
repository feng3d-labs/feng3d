import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { shaderlib } from '@feng3d/renderer';
import { decoratorRegisterClass, serialize } from '@feng3d/serialization';
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

@decoratorRegisterClass()
export class PointMaterial extends Material
{
    __class__: 'PointMaterial';

    uniforms = new PointUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'point';
        this.renderParams.renderMode = 'POINTS';
    }
}

@decoratorRegisterClass()
export class PointUniforms
{
    __class__: 'PointUniforms';
    /**
     * 颜色
     */
    @serialize
    @oav()
    u_color = new Color4();

    /**
     * 点绘制时点的尺寸
     */
    @serialize
    @oav()
    u_PointSize = 1;
}

shaderlib.shaderConfig.shaders.point = {
    vertex: pointVertex,
    fragment: pointFragment,
    cls: PointUniforms
};
