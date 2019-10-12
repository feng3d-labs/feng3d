namespace feng3d
{
    export class ImageDataTexture2D extends Texture2D
    {
        get imageData()
        {
            return this._imageData;
        }
        set imageData(v)
        {
            if (this._imageData == v) return;
            this._imageData = v;
            this.imageDataChanged();
        }
        private _imageData: ImageData;

        private imageDataChanged()
        {
            this._pixels = this.imageData;
            this.invalidate();
        }
    }
}