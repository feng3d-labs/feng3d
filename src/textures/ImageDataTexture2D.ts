namespace feng3d
{
    export class ImageDataTexture2D extends Texture2D
    {
        @watch("_imageDataChanged")
        imageData: ImageData;

        private _imageDataChanged()
        {
            this._pixels = this.imageData;
            this.invalidate();
        }
    }
}