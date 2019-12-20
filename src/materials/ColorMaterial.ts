namespace feng3d
{
    export interface UniformsTypes { color: ColorUniforms }

    export class ColorUniforms
    {
        __class__: "feng3d.ColorUniforms";
        /** 
         * 颜色
         */
        @serialize
        @oav()
        u_diffuseInput = new Color4();
    }

    shaderConfig.shaders["color"].cls = ColorUniforms;
}