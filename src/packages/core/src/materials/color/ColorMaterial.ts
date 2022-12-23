import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { shaderlib } from '@feng3d/renderer';
import { decoratorRegisterClass, serialize } from '@feng3d/serialization';
import { Material } from '../Material';
import colorFragment from './color_fragment_glsl';
import colorVertex from './color_vertex_glsl';

declare global
{
    interface MixinsMaterialMap
    {
        color: ColorMaterial
    }

    export interface MixinsDefaultMaterial
    {
        'Color-Material': ColorMaterial;
    }
}

/**
 * 纯颜色材质
 */
@decoratorRegisterClass()
export class ColorMaterial extends Material
{
    __class__: 'ColorMaterial';

    uniforms = new ColorUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'color';
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
