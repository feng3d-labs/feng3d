namespace feng3d
{
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    export class PointMaterial extends Material
    {
        @oav()
        @serialize()
        color = new Color();

        /**
         * 构建颜色材质
         */
        constructor()
        {
            super();
            this.shaderName = "point";
            this.renderMode = RenderMode.POINTS;
            //
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.u_color = () => this.color;
        }
    }
}