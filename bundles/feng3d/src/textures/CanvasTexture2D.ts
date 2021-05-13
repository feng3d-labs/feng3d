import { watch } from "../utils/Watcher";
import { Texture2D } from "./Texture2D";

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
