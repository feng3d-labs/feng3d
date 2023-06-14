import { watcher } from '../watcher/watcher';
import { SourceTexture2D } from './SourceTexture2D';

export class VideoTexture2D extends SourceTexture2D
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
