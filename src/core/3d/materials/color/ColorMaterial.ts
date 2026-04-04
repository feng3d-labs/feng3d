import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { shaderlib } from '@feng3d/renderer';
import { Serializable, SerializeProperty } from '@feng3d/serialization';
import { Material, RegisterMaterial } from '../../../core/Material';
import colorFragment from './color.fragment.glsl';
import colorVertex from './color.vertex.glsl';

declare module '../../../core/Material'
{
    interface MaterialMap { ColorMaterial: ColorMaterial }
    interface UniformsMap { ColorUniforms: ColorUniforms }

    interface DefaultMaterialMap { 'Color-Material': ColorMaterial; }
}

/**
 * 纯颜色材质
 */
@RegisterMaterial('ColorMaterial')
export class ColorMaterial extends Material
{
    declare __class__: 'ColorMaterial';

    uniforms = new ColorUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'color';
    }
}

@Serializable('ColorUniforms')
export class ColorUniforms
{
    declare __class__: 'ColorUniforms';
    /**
     * 颜色
     */
    @SerializeProperty()
    @oav()
    u_diffuseInput = new Color4();
}

shaderlib.shaderConfig.shaders.color = {
    fragment: colorFragment,
    vertex: colorVertex,
};
