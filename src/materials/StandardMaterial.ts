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
        public diffuseMethod = new DiffuseMethod();

        /**
         * 法线函数
         */
        public normalMethod = new NormalMethod();

        /**
         * 镜面反射函数
         */
        public specularMethod = new SpecularMethod();

        /**
         * 环境反射函数
         */
        public ambientMethod = new AmbientMethod();

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
         * 构建
         */
        constructor()
        {
            super();
            this.shaderName = "standard";

            this.addComponent(this.diffuseMethod);
            this.addComponent(this.normalMethod);
            this.addComponent(this.specularMethod);
            this.addComponent(this.ambientMethod);

            Watcher.watch(this, ["ambientColor"], this.invalidateRenderData, this);
            Watcher.watch(this, ["reflectance"], this.invalidateRenderData, this);
            Watcher.watch(this, ["roughness"], this.invalidateRenderData, this);
            Watcher.watch(this, ["metalic"], this.invalidateRenderData, this);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            // renderData.uniforms[RenderDataID.u_reflectance] = this.reflectance;
            // renderData.uniforms[RenderDataID.u_roughness] = this.roughness;
            // renderData.uniforms[RenderDataID.u_metalic] = this.metalic;
            //
            super.updateRenderData(renderContext, renderData);
        }
    }
}