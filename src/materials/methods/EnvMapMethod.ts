namespace feng3d
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
            //
            this.createUniformData("s_envMap", () => this._cubeTexture);
            this.createUniformData("u_reflectivity", () => this._reflectivity);
            this.createBoolMacro("HAS_ENV_METHOD", true);
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
            if (this._cubeTexture == value)
                return;
            this._cubeTexture = value;
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
            if (this._reflectivity == value)
                return;
            this._reflectivity = value;
        }
    }
}