namespace feng3d
{
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    export class PointMaterial extends Material
    {
        shaderName =  "point";
        
        uniforms = new PointUniforms();

        renderParams = new RenderParams({ renderMode: RenderMode.POINTS });
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