namespace feng3d
{
    export var imageDatas = {
        black: imageUtil.createImageData(1, 1, ColorKeywords.black),
        white: imageUtil.createImageData(1, 1, ColorKeywords.white),
        red: imageUtil.createImageData(1, 1, ColorKeywords.red),
        green: imageUtil.createImageData(1, 1, ColorKeywords.green),
        blue: imageUtil.createImageData(1, 1, ColorKeywords.blue),
        defaultNormal: imageUtil.createImageData(1, 1, 0x8080ff),
    }

    /**
     * 2D纹理
     */
    export abstract class Texture2D extends TextureInfo
    {
        /**
         * 当贴图数据未加载好等情况时代替使用
         */
        noPixels: ImageData;

        constructor(raw?: gPartial<Texture2D>)
        {
            super(raw);
            this.noPixels = this.noPixels || imageDatas.white;
            this._textureType = TextureType.TEXTURE_2D;
        }
    }
}