namespace feng3d
{
    export class ImageDataTexture extends TextureInfo
    {
        get pixels()
        {
            return this._pixels;
        }

        set pixels(value)
        {
            this._pixels = value;
        }

        protected _pixels: ImageData;

        constructor()
        {
            super();
            this._textureType = TextureType.TEXTURE_2D;
        }

        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData()
        {
            if (!this._pixels)
                return false;

            if (!this._pixels.width || !this._pixels.height)
                return false;

            return true;
        }
    }
}