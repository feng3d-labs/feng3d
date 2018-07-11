namespace feng3d
{
    /**
     * 2D纹理
     * @author feng 2016-12-20
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