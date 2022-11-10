import { watcher } from '@feng3d/watcher';
import { Texture2D } from './Texture2D';

export class VideoTexture2D extends Texture2D
{
    video: HTMLVideoElement;

    constructor()
    {
        super();
        watcher.watch(this as VideoTexture2D, 'video', this._videoChanged, this);
    }

    private _videoChanged()
    {
        this._pixels = this.video;
        this.invalidate();
    }
}
