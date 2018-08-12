namespace feng3d
{
    /**
     * 2D纹理
     */
    export class ImageTexture2D extends Texture2D
    {
        @watch("imageChanged")
        image: HTMLImageElement;

        constructor(raw?: gPartial<ImageTexture2D>)
        {
            super(raw);
        }

        private imageChanged()
        {
            this._pixels = this.image;
            this.invalidate();
        }
    }
}