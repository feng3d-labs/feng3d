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

        constructor(raw?: gPartial<ImageDataTexture>)
        {
            super(raw);
            this.noPixels = this.noPixels || imageDatas.white;
            this._textureType = TextureType.TEXTURE_2D;
        }
    }
}