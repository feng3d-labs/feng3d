import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { shaderlib } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import colorFragment from '../shaders/color.fragment.glsl';
import colorVertex from '../shaders/color.vertex.glsl';

declare global
{
    interface MixinsUniformsTypes
    {
        color: ColorUniforms
    }
}

@decoratorRegisterClass()
export class ColorUniforms
{
    __class__: 'ColorUniforms';
    /**
     * 颜色
     */
    @serialize
    @oav()
    u_diffuseInput = new Color4();
}

shaderlib.shaderConfig.shaders.color = { fragment: colorFragment, vertex: colorVertex, cls: ColorUniforms };
