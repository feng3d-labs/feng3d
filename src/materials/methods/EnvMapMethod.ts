namespace feng3d
{
	/**
	 * 环境映射函数
	 */
    export class EnvMapMethod extends EventDispatcher
    {
        /**
		 * 环境映射贴图
		 */
        @watch("enableChanged")
        @serialize()
        @oav()
        cubeTexture: TextureCube;

        /**
		 * 反射率
		 */
        @serialize()
        @oav()
        reflectivity = 1;

        /**
		 * 创建EnvMapMethod实例
		 * @param envMap		        环境映射贴图
		 * @param reflectivity			反射率
		 */
        constructor()
        {
            super();
            //
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.s_envMap = () => this.cubeTexture;
            renderAtomic.uniforms.u_reflectivity = () => this.reflectivity;
        }
    }
}