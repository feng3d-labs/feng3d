namespace feng3d
{
    /**
     * 标准材质
     * @author feng 2016-05-02
     */
    export class StandardMaterial extends Material
    {
        /**
         * 漫反射函数
         */
        @watch("onmethodchange")
        @serialize()
        @oav()
        diffuseMethod = new DiffuseMethod();

        /**
         * 法线函数
         */
        @watch("onmethodchange")
        @serialize()
        @oav()
        normalMethod = new NormalMethod();

        /**
         * 镜面反射函数
         */
        @watch("onmethodchange")
        @serialize()
        @oav()
        specularMethod = new SpecularMethod();

        /**
         * 环境反射函数
         */
        @watch("onmethodchange")
        @serialize()
        @oav()
        ambientMethod = new AmbientMethod();

        @watch("onmethodchange")
        @serialize()
        @oav()
        envMapMethod = new EnvMapMethod();

        @watch("onmethodchange")
        @serialize()
        @oav()
        fogMethod = new FogMethod();

        @watch("onmethodchange")
        @serialize()
        @oav()
        terrainMethod = new TerrainMethod();
        // terrainMethod: TerrainMethod | TerrainMergeMethod;

        /**
         * 是否开启混合
         */
        get enableBlend()
        {
            return this._enableBlend || (this.diffuseMethod && this.diffuseMethod.color.a != 1.0);
        }

        set enableBlend(value: boolean)
        {
            this._enableBlend = value;
        }

        /**
         * 构建
         */
        constructor(diffuseUrl = "", normalUrl = "", specularUrl = "", ambientUrl = "")
        {
            super();
            this.shaderName = "standard";

            //
            this.diffuseMethod.difuseTexture.url = diffuseUrl;
            this.normalMethod.normalTexture.url = normalUrl;
            this.specularMethod.specularTexture.url = specularUrl;
            this.ambientMethod.ambientTexture.url = ambientUrl;
        }

        preRender(renderAtomic: RenderAtomic)
        {
            super.preRender(renderAtomic);

            this.diffuseMethod.preRender(renderAtomic);
            this.normalMethod.preRender(renderAtomic);
            this.specularMethod.preRender(renderAtomic);
            this.ambientMethod.preRender(renderAtomic);
            this.envMapMethod.preRender(renderAtomic);
            this.fogMethod.preRender(renderAtomic);
            this.terrainMethod.preRender(renderAtomic);
        }
    }
}