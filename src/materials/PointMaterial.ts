namespace feng3d
{
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    export class PointMaterial extends Material
    {
        /**
         * 构建颜色材质
         */
        constructor()
        {
            super();
            this.shaderName = "point";
            this.renderMode = RenderMode.POINTS;
        }
    }
}