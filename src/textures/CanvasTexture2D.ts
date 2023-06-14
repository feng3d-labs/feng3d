import { watcher } from '../watcher/watcher';
import { SourceTexture2D } from './SourceTexture2D';

export class CanvasTexture2D extends SourceTexture2D
{
    canvas: HTMLCanvasElement;

    constructor()
    {
        super();
        watcher.watch(this as CanvasTexture2D, 'canvas', this._canvasChanged, this);
    }

    private _canvasChanged()
    {
        this.source = this.canvas;
    }
}
