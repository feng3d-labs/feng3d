namespace feng3d
{
    export class ColorUniforms
    {
        /** 
         * 颜色
         */
        @serialize()
        @oav()
        u_diffuseInput = new Color();
    }

    shaderConfig.shaders["color"].cls = ColorUniforms;
}