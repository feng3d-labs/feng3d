import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { shaderlib } from '../render/data/ShaderLib';
import { serialize } from '@feng3d/serialization';

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

shaderlib.shaderConfig.shaders.point = { cls: PointUniforms };
