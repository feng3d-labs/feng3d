declare namespace feng3d {
    /**
     * 法线函数
     * @author feng 2017-03-22
     */
    class NormalMethod extends RenderDataHolder {
        /**
         * 漫反射纹理
         */
        normalTexture: Texture2D;
        private _normalTexture;
        /**
         * 构建
         */
        constructor(normalUrl?: string);
    }
}
