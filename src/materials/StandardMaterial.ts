namespace feng3d
{

    export interface MaterialFactory
    {
        create(shader: "standard"): Material & { uniforms: StandardUniforms; };
    }

    /**
     * 标准材质
     * @author feng 2016-05-02
     */
    export class StandardMaterial extends Material
    {
        uniforms = new StandardUniforms();

        terrainMethod = new TerrainMethod();
        // terrainMethod: TerrainMethod | TerrainMergeMethod;

        /**
         * 构建
         */
        constructor()
        {
            super();
            this.shaderName = "standard";
        }

        preRender(renderAtomic: RenderAtomic)
        {
            super.preRender(renderAtomic);

            this.terrainMethod.preRender(renderAtomic);

            // 序列化时引发bug
            this.uniforms.s_normal.noPixels = imageDatas.defaultNormal;
        }
    }

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

    export class StandardUniforms
    {
        /**
         * 点绘制时点的尺寸
         */
        @serialize()
        @oav()
        u_PointSize = 1;

        /**
         * 漫反射纹理
         */
        @serialize()
        @oav({ block: "diffuse" })
        s_diffuse = new Texture2D();

        /**
         * 基本颜色
         */
        @serialize()
        @oav({ block: "diffuse" })
        u_diffuse = new Color4(1, 1, 1, 1);

        /**
         * 透明阈值，透明度小于该值的像素被片段着色器丢弃
         */
        @serialize()
        @oav({ block: "diffuse" })
        u_alphaThreshold = 0;

        /**
         * 漫反射纹理
         */
        @serialize()
        @oav({ block: "normalMethod" })
        s_normal = new Texture2D();

        /**
         * 镜面反射光泽图
         */
        @serialize()
        @oav({ block: "specular" })
        s_specular = new Texture2D();

        /**
         * 镜面反射颜色
         */
        @serialize()
        @oav({ block: "specular" })
        u_specular = new Color3();

        /**
         * 高光系数
         */
        @serialize()
        @oav({ block: "specular" })
        u_glossiness = 50;

        /**
         * 环境纹理
         */
        @serialize()
        @oav({ block: "ambient" })
        s_ambient = new Texture2D();

        /**
         * 颜色
         */
        @serialize()
        @oav({ block: "ambient" })
        u_ambient = new Color4();

        /**
         * 环境映射贴图
         */
        @serialize()
        @oav({ block: "envMap" })
        s_envMap = new TextureCube();

        /**
         * 反射率
         */
        @serialize()
        @oav({ block: "envMap" })
        u_reflectivity = 1;

        /**
         * 出现雾效果的最近距离
         */
        @serialize()
        @oav({ block: "fog" })
        u_fogMinDistance = 0;

        /**
         * 最远距离
         */
        @serialize()
        @oav({ block: "fog" })
        u_fogMaxDistance = 100;

        /**
         * 雾的颜色
         */
        @serialize()
        @oav({ block: "fog" })
        u_fogColor = new Color3();

        @serialize()
        @oav({ block: "fog" })
        u_fogDensity = 0.1;

        /**
         * 雾模式
         */
        @serialize()
        @oav({ block: "fog" })
        u_fogMode = FogMode.NONE;

        constructor()
        {
            this.s_normal.noPixels = imageDatas.defaultNormal;
        }
    }

    shaderConfig.shaders["standard"].cls = StandardUniforms;

    export var Mat =
        {
            standard: StandardUniforms,
        }

    Mat.standard
}