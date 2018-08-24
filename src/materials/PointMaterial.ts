namespace feng3d
{

    export interface MaterialMap { PointMaterial: PointMaterial }

    /**
     * 颜色材质
     */
    export class PointMaterial extends Material
    {
        __class__: "feng3d.PointMaterial" = "feng3d.PointMaterial";

        uniforms: PointUniforms;

        constructor()
        {
            super();
            this.shaderName = "point";
            this.uniforms = new PointUniforms();
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