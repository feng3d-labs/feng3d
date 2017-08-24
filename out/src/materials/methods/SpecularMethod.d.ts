declare namespace feng3d {
    /**
     * 法线函数
     * @author feng 2017-03-22
     */
    class SpecularMethod extends RenderDataHolder {
        /**
         * 镜面反射光泽图
         */
        specularTexture: Texture2D;
        private _specularTexture;
        /**
         * 镜面反射颜色
         */
        specularColor: Color;
        /**
         * 镜面反射光反射强度
         */
        specular: number;
        /**
         * 高光系数
         */
        glossiness: number;
        /**
         * 构建
         */
        constructor(specularUrl?: string);
    }
}
