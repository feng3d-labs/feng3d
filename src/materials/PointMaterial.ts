namespace feng3d
{
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    export class PointMaterial extends Material
    {
        uniforms = new PointUniforms();

        /**
         * 构建颜色材质
         */
        constructor()
        {
            super();
            this.shaderName = "point";
            this.renderParams.renderMode = RenderMode.POINTS;
            //
        }
    }

    export class PointUniforms
    {
        /** 
         * 颜色
         */
        @serialize
        @oav()
        u_color = new Color4();

        /**
         * 点绘制时点的尺寸
         */
        @serialize
        @oav()
        u_PointSize = 1;
    }

    shaderConfig.shaders["point"].cls = PointUniforms;
}