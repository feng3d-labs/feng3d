namespace feng3d
{
    /**
     * 雾模式
     */
    export enum FogMode
    {
        NONE = 0,
        EXP = 1,
        EXP2 = 2,
        LINEAR = 3
    }

    export interface UniformsMap { standard: StandardUniforms }

    export class StandardUniforms
    {
        __class__: "feng3d.StandardUniforms" | "feng3d.TerrainUniforms" | "feng3d.ParticleUniforms" = "feng3d.StandardUniforms";
        /**
         * 点绘制时点的尺寸
         */
        @serialize
        @oav()
        u_PointSize = 1;

        /**
         * 漫反射纹理
         */
        @serializeAssets
        @oav({ block: "diffuse" })
        s_diffuse = UrlImageTexture2D.default;

        /**
         * 基本颜色
         */
        @serialize
        @oav({ block: "diffuse" })
        u_diffuse = new Color4(1, 1, 1, 1);

        /**
         * 透明阈值，透明度小于该值的像素被片段着色器丢弃
         */
        @serialize
        @oav({ block: "diffuse" })
        u_alphaThreshold = 0;

        /**
         * 漫反射纹理
         */
        @serializeAssets
        @oav({ block: "normalMethod" })
        s_normal = UrlImageTexture2D.defaultNormal;

        /**
         * 镜面反射光泽图
         */
        @serializeAssets
        @oav({ block: "specular" })
        s_specular = UrlImageTexture2D.default;

        /**
         * 镜面反射颜色
         */
        @serialize
        @oav({ block: "specular" })
        u_specular = new Color3();

        /**
         * 高光系数
         */
        @serialize
        @oav({ block: "specular" })
        u_glossiness = 50;

        /**
         * 环境纹理
         */
        @serializeAssets
        @oav({ block: "ambient" })
        s_ambient = UrlImageTexture2D.default;

        /**
         * 颜色
         */
        @serialize
        @oav({ block: "ambient" })
        u_ambient = new Color4();

        /**
         * 环境映射贴图
         */
        @serializeAssets
        @oav({ component: "OAVPick", block: "envMap", componentParam: { accepttype: "texturecube", datatype: "texturecube" } })
        s_envMap = TextureCube.default;

        /**
         * 反射率
         */
        @serialize
        @oav({ block: "envMap" })
        u_reflectivity = 1;

        /**
         * 出现雾效果的最近距离
         */
        @serialize
        @oav({ block: "fog" })
        u_fogMinDistance = 0;

        /**
         * 最远距离
         */
        @serialize
        @oav({ block: "fog" })
        u_fogMaxDistance = 100;

        /**
         * 雾的颜色
         */
        @serialize
        @oav({ block: "fog" })
        u_fogColor = new Color3();

        @serialize
        @oav({ block: "fog" })
        u_fogDensity = 0.1;

        /**
         * 雾模式
         */
        @serialize
        @oav({ block: "fog", component: "OAVEnum", componentParam: { enumClass: FogMode } })
        u_fogMode = FogMode.NONE;
    }

    shaderConfig.shaders["standard"].cls = StandardUniforms;

    Feng3dAssets.setAssets(Material.default = Object.setValue(new Material(), { name: "Default-Material", assetsId: "Default-Material", hideFlags: HideFlags.NotEditable }));
}