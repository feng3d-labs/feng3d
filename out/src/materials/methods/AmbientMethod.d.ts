declare namespace feng3d {
    /**
     * 漫反射函数
     * @author feng 2017-03-22
     */
    class AmbientMethod extends RenderDataHolder {
        /**
         * 环境纹理
         */
        ambientTexture: Texture2D;
        private _ambientTexture;
        /**
         * 颜色
         */
        color: Color;
        private _color;
        /**
         * 构建
         */
        constructor(ambientUrl?: string, color?: Color);
    }
}
