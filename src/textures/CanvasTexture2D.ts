namespace feng3d
{
    export class CanvasTexture2D extends Texture2D
    {
        @watch("canvasChanged")
        canvas: HTMLCanvasElement;

        private canvasChanged()
        {
            this._pixels = this.canvas;
            this.invalidate();
        }
    }
}