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
        defaultParticle = "defaultParticle",
    }

    export var imageDatas = {
        black: new ImageUtil(1, 1, Color4.fromUnit24(ColorKeywords.black)).imageData,
        white: new ImageUtil(1, 1, Color4.fromUnit24(ColorKeywords.white)).imageData,
        red: new ImageUtil(1, 1, Color4.fromUnit24(ColorKeywords.red)).imageData,
        green: new ImageUtil(1, 1, Color4.fromUnit24(ColorKeywords.green)).imageData,
        blue: new ImageUtil(1, 1, Color4.fromUnit24(ColorKeywords.blue)).imageData,
        defaultNormal: new ImageUtil(1, 1, Color4.fromUnit24(0x8080ff)).imageData,
        defaultParticle: new ImageUtil().drawDefaultParticle().imageData,
    }

    /**
     * 2D纹理
     */
    export class Texture2D extends TextureInfo
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