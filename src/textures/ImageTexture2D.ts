namespace feng3d
{
    /**
     * 2D纹理
     */
    export class ImageTexture2D extends Texture2D
    {
        // __class__: "feng3d.ImageTexture2D" = "feng3d.ImageTexture2D";

        get image()
        {
            return this._image;
        }
        set image(v)
        {
            if (this._image == v) return;
            this._image = v;
            this.imageChanged();
        }
        private _image: HTMLImageElement;

        private imageChanged()
        {
            this._pixels = this.image;
            this.invalidate();
        }
    }
}