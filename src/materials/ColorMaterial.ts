namespace feng3d
{
    export interface MaterialMap { ColorMaterial: ColorMaterial }

    /**
     * 颜色材质
     */
    export class ColorMaterial extends Material
    {
        __class__: "feng3d.ColorMaterial" = "feng3d.ColorMaterial";

        shaderName: "color" = "color";

        uniforms = new ColorUniforms();
    }

    export class ColorUniforms
    {
        /** 
         * 颜色
         */
        @serialize
        @oav()
        u_diffuseInput = new Color4();
    }

    shaderConfig.shaders["color"].cls = ColorUniforms;
}