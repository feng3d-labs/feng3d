namespace feng3d
{
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    export type PointMaterial = Material & { uniforms: PointUniforms; };

    export interface MaterialFactory
    {
        create(shader: "point", raw?: Partial<PointMaterial>): PointMaterial;
    }

    export interface MaterialRawMap
    {
        point: Partial<PointMaterial>
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