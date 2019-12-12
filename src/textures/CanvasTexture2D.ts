namespace feng3d
{
    export class CanvasTexture2D extends Texture2D
    {

        @watch("_canvasChanged")
        canvas: HTMLCanvasElement;

        private _canvasChanged()
        {
            this._pixels = this.canvas;
            this.invalidate();
        }
    }
}