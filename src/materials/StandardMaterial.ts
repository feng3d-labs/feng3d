namespace feng3d
{
    /**
     * 标准材质
     * @author feng 2016-05-02
     */
    export class StandardMaterial extends Material
    {
        uniforms = new StandardUniforms();

        @serialize()
        @oav()
        fogMethod = new FogMethod();

        @serialize()
        @oav()
        terrainMethod = new TerrainMethod();
        // terrainMethod: TerrainMethod | TerrainMergeMethod;

        /**
         * 构建
         */
        constructor(diffuseUrl = "", normalUrl = "", specularUrl = "", ambientUrl = "")
        {
            super();
            this.shaderName = "standard";
            this.uniforms.s_diffuse.url = diffuseUrl;
            this.uniforms.s_normal.url = normalUrl;
            this.uniforms.s_specular.url = specularUrl;
            this.uniforms.s_ambient.url = ambientUrl;
        }

        preRender(renderAtomic: RenderAtomic)
        {
            super.preRender(renderAtomic);

            this.fogMethod.preRender(renderAtomic);
            this.terrainMethod.preRender(renderAtomic);

            // 序列化时引发bug
            this.uniforms.s_normal.noPixels = imageDatas.defaultNormal;
        }
    }

    export class StandardUniforms
    {
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
        u_diffuse = new Color3(1, 1, 1, 1);

        /**
         * 透明阈值，透明度小于该值的像素被片段着色器丢弃
         */
        @serialize(0)
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
        @serialize(50)
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
        u_ambient = new Color3();

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

        constructor()
        {
            this.s_normal.noPixels = imageDatas.defaultNormal;
        }
    }

    shaderConfig.shaders["standard"].cls = StandardUniforms;
}