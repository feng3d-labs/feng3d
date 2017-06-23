module feng3d
{
	/**
	 * 环境映射函数
	 */
    export class EnvMapMethod extends RenderDataHolder
    {
        private _cubeTexture: TextureCube;
        private _reflectivity: number;

        /**
		 * 创建EnvMapMethod实例
		 * @param envMap		        环境映射贴图
		 * @param reflectivity			反射率
		 */
        constructor(envMap: TextureCube, reflectivity: number = 1)
        {
            super();
            this._cubeTexture = envMap;
            this.reflectivity = reflectivity;
        }

        /**
		 * 环境映射贴图
		 */
        public get envMap()
        {
            return this._cubeTexture;
        }

        public set envMap(value)
        {
            this._cubeTexture = value;
            this.invalidateRenderData();
        }

        /**
		 * 反射率
		 */
        public get reflectivity(): number
        {
            return this._reflectivity;
        }

        public set reflectivity(value: number)
        {
            this._reflectivity = value;
            this.invalidateRenderData();
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            renderData.shaderMacro.boolMacros.HAS_ENV_METHOD = true;
            renderData.uniforms.s_envMap = this._cubeTexture;
            renderData.uniforms.u_reflectivity = this._reflectivity;

            //
            super.updateRenderData(renderContext, renderData);
        }
    }
}