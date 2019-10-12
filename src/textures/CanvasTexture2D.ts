namespace feng3d
{
    export class CanvasTexture2D extends Texture2D
    {
        get canvas()
        {
            return this._canvas;
        }
        set canvas(v)
        {
            if (this._canvas == v) return;
            this._canvas = v;
            this.canvasChanged();
        }
        private _canvas: HTMLCanvasElement;

        private canvasChanged()
        {
            this._pixels = this.canvas;
            this.invalidate();
        }
    }
}