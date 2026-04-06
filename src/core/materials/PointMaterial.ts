import { Color4 } from '../../math/Color4';
import { oav } from '../../objectview/ObjectView';
import { decoratorRegisterClass } from '../../polyfill/ClassUtils';
import { shaderlib } from '../../renderer/shader/ShaderLib';
import { serialize } from '../../serialization/Serialization';
import pointFragment from '../shaders/point.fragment.glsl';
import pointVertex from '../shaders/point.vertex.glsl';

declare global
{
    interface MixinsUniformsTypes
    {
        point: PointUniforms
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

shaderlib.shaderConfig.shaders.point = { fragment: pointFragment, vertex: pointVertex, cls: PointUniforms };
