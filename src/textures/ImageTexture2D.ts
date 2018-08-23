namespace feng3d
{
    /**
     * 2D纹理
     */
    export class ImageTexture2D extends Texture2D
    {
        __class__: "feng3d.ImageTexture2D" = "feng3d.ImageTexture2D";

        @watch("imageChanged")
        image: HTMLImageElement;

        private imageChanged()
        {
            this._pixels = this.image;
            this.invalidate();
        }
    }
}