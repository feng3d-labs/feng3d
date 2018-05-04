namespace feng3d
{
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    export class ColorMaterial extends Material
    {
        uniforms = new ColorUniforms();

        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color?: Color3)
        {
            super();
            this.shaderName = "color";
            if (color)
                this.uniforms.u_diffuseInput.copyFrom(color);
        }

        preRender(renderAtomic: RenderAtomic)
        {
            super.preRender(renderAtomic);

            renderAtomic.uniforms.u_diffuseInput = this.uniforms.u_diffuseInput;
        }
    }

    export class ColorUniforms
    {
        /** 
         * 颜色
         */
        @serialize()
        @oav()
        u_diffuseInput = new Color3();
    }

    shaderConfig.shaders["color"].cls = ColorUniforms;
}