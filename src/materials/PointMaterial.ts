namespace feng3d
{

    export interface UniformsTypes { point: PointUniforms }
    export class PointUniforms
    {
        __class__: "feng3d.PointUniforms";
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
    shaderConfig.shaders["point"].renderParams = { renderMode: RenderMode.POINTS, enableBlend: true };

    export interface DefaultMaterial
    {
        "Point-Material": Material;
    }

    Material.setDefault("Point-Material", { shaderName: "point" });
    
}