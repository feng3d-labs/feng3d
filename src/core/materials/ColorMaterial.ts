import { Color4 } from '../../math/Color4';
import { oav } from '../../objectview/ObjectView';
import { decoratorRegisterClass } from '../../polyfill/ClassUtils';
import { shaderlib } from '../../renderer/shader/ShaderLib';
import { serialize } from '../../serialization/Serialization';
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
