namespace feng3d
{
    export type WaterMaterial = Material & { uniforms: WaterUniforms; };

    export interface MaterialFactory
    {
        create(shader: "water", raw?: gPartial<WaterMaterial>): WaterMaterial;
    }

    export class WaterUniforms
    {
        @serialize
        @oav({ componentParam: { tooltip: "透明度" } })
        u_alpha = 1.0;

        // @serialize
        // @oav({ componentParam: { tooltip: "水体运动时间，默认自动递增" } })
        u_time = 0.0;

        @serialize
        @oav({ componentParam: { tooltip: "水体展现的尺寸" } })
        u_size = 10.0;

        @oav()
        @serialize
        u_distortionScale = 20.0;

        @serialize
        @oav({ componentParam: { tooltip: "水体颜色" } })
        u_waterColor = new Color3().fromUnit(0x555555);

        
        @oav()
        @serialize
        @oav({ componentParam: { tooltip: "水体法线图" } })
        s_normalSampler = new Texture2D();
        
        /**
         * 镜面反射贴图
         */
        s_mirrorSampler = new Texture2D();
        
        u_textureMatrix = new Matrix4x4();
        u_sunColor = new Color3().fromUnit(0x7F7F7F);
        u_sunDirection = new Vector3(0.70707, 0.70707, 0);
    }

    shaderConfig.shaders["water"].cls = WaterUniforms;
}