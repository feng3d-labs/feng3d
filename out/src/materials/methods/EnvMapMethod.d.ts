declare namespace feng3d {
    /**
     * 环境映射函数
     */
    class EnvMapMethod extends RenderDataHolder {
        private _cubeTexture;
        private _reflectivity;
        /**
         * 创建EnvMapMethod实例
         * @param envMap		        环境映射贴图
         * @param reflectivity			反射率
         */
        constructor(envMap: TextureCube, reflectivity?: number);
        /**
         * 环境映射贴图
         */
        envMap: TextureCube;
        /**
         * 反射率
         */
        reflectivity: number;
    }
}
