namespace feng3d
{
    export class ImageDataTexture2D extends Texture2D
    {
        @watch("imageDataChanged")
        imageData: ImageData;

        private imageDataChanged()
        {
            this._pixels = this.imageData;
            this.invalidate();
        }
    }
}