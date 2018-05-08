namespace feng3d
{
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    export type PointMaterial = Material & { uniforms: PointUniforms; };

    export interface MaterialFactory
    {
        create(shader: "point", raw?: PointMaterialRaw): PointMaterial;
    }

    export interface MaterialRawMap
    {
        point: PointMaterialRaw
    }

    export interface PointMaterialRaw extends MaterialBaseRaw
    {
        shaderName?: "point",
        uniforms?: PointUniformsRaw;
    }

    export interface PointUniformsRaw
    {
        /**
         * 类全名
         */
        __class__?: "feng3d.SegmentUniforms",
        /** 
         * 颜色
         */
        u_color?: Color4 | Color4Raw,

        /**
         * 点绘制时点的尺寸
         */
        u_PointSize?: number;
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