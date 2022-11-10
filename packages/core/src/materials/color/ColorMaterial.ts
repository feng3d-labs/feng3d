import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/serialization';
import { shaderlib } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import colorFragment from './color_fragment_glsl';
import colorVertex from './color_vertex_glsl';

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

shaderlib.shaderConfig.shaders.color = {
    fragment: colorFragment,
    vertex: colorVertex,
    cls: ColorUniforms
};
