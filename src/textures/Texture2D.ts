namespace feng3d
{
    export enum ImageDatas
    {
        black = "black",
        white = "white",
        red = "red",
        green = "green",
        blue = "blue",
        defaultNormal = "defaultNormal",
    }

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
        noPixels = ImageDatas.white;

        /**
         * 纹理类型
         */
        protected _textureType = TextureType.TEXTURE_2D;
    }
}