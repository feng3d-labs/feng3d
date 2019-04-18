namespace feng3d
{

    export interface UniformsMap { point: PointUniforms }
    export class PointUniforms
    {
        __class__: "feng3d.PointUniforms" = "feng3d.PointUniforms";
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