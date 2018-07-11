namespace feng3d
{
    export class CanvasTexture2D extends Texture2D
    {
        @watch("canvasChanged")
        canvas: HTMLCanvasElement;

        constructor(raw?: gPartial<CanvasTexture2D>)
        {
            super(raw);
        }

        private canvasChanged()
        {
            this._pixels = this.canvas;
            this.invalidate();
        }
    }
}