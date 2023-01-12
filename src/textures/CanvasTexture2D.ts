import { watcher } from '../watcher/watcher';
import { Texture2D } from './Texture2D';

export class CanvasTexture2D extends Texture2D
{
    canvas: HTMLCanvasElement;

    constructor()
    {
        super();
        watcher.watch(this as CanvasTexture2D, 'canvas', this._canvasChanged, this);
    }

    private _canvasChanged()
    {
        this._pixels = this.canvas;
        this.invalidate();
    }
}
