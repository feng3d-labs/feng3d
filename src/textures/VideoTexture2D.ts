import { watcher } from '../watcher/watcher';
import { Texture2D } from './Texture2D';

export class VideoTexture2D extends Texture2D
{
    video: HTMLVideoElement;

    constructor()
    {
        super();
        watcher.watch(this as VideoTexture2D, 'video', this._onVideoChanged, this);
    }

    private _onVideoChanged()
    {
        this.source = this.video;
    }
}
