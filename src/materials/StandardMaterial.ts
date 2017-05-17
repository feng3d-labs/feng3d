module feng3d
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
        public get diffuseMethod()
        {
            return this._diffuseMethod;
        }
        public set diffuseMethod(value)
        {
            this._diffuseMethod = value;
            if (this._diffuseMethod)
                this.addMethod(this._diffuseMethod);
        }
        private _diffuseMethod: DiffuseMethod;

        /**
         * 法线函数
         */
        public get normalMethod()
        {
            return this._normalMethod;
        }
        public set normalMethod(value)
        {
            this._normalMethod = value;
            if (this._normalMethod)
                this.addMethod(this._normalMethod);
        }
        private _normalMethod: NormalMethod;

        /**
         * 镜面反射函数
         */
        public get specularMethod()
        {
            return this._specularMethod;
        }
        public set specularMethod(value)
        {
            this._specularMethod = value;
            if (this._specularMethod)
                this.addMethod(this._specularMethod);
        }
        private _specularMethod : SpecularMethod;

        /**
         * 环境反射函数
         */
        public get ambientMethod()
        {
            return this._ambientMethod;
        }
        public set ambientMethod(value)
        {
            this._ambientMethod = value;
            if (this._ambientMethod)
                this.addMethod(this._ambientMethod);
        }
        private _ambientMethod : AmbientMethod;

        /**
         * 地形函数
         */
        public get terrainMethod()
        {
            return this._terrainMethod;
        }
        public set terrainMethod(value)
        {
            if (this._terrainMethod)
            {
                this.removeComponent(this._terrainMethod);
            }
            this._terrainMethod = value;
            if (this._terrainMethod)
            {
                this.addComponent(this._terrainMethod);
                this.invalidateRenderData();
            }
        }
        private _terrainMethod: RenderDataHolder;

        // /**
        //  * 反射率
        //  */
        // public reflectance: number = 1.0;

        // /**
        //  * 粗糙度
        //  */
        // public roughness: number = 1.0;

        // /**
        //  * 金属度
        //  */
        // public metalic: number = 1.0;

        /**
         * 是否开启混合
         */
        public get enableBlend()
        {
            return this._enableBlend || this.diffuseMethod.color.a != 1.0;
        }

        public set enableBlend(value: boolean)
        {
            this._enableBlend = value;
        }

        /**
         * 构建
         */
        constructor(diffuseUrl = "", normalUrl = "",specularUrl = "",ambientUrl = "")
        {
            super();
            this.shaderName = "standard";

            this.diffuseMethod = new DiffuseMethod(diffuseUrl);
            this.normalMethod = new NormalMethod(normalUrl);
            this.specularMethod =  new SpecularMethod(specularUrl);
            this.ambientMethod= new AmbientMethod(ambientUrl);

            // Watcher.watch(this, ["ambientColor"], this.invalidateRenderData, this);
            // Watcher.watch(this, ["reflectance"], this.invalidateRenderData, this);
            // Watcher.watch(this, ["roughness"], this.invalidateRenderData, this);
            // Watcher.watch(this, ["metalic"], this.invalidateRenderData, this);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            // renderData.uniforms.u_reflectance = this.reflectance;
            // renderData.uniforms.u_roughness = this.roughness;
            // renderData.uniforms.u_metalic = this.metalic;
            //
            super.updateRenderData(renderContext, renderData);
        }
    }
}