import { watch } from "@feng3d/watcher";
import { Texture2D } from "./Texture2D";

export class VideoTexture2D extends Texture2D
{
    @watch("_videoChanged")
    video: HTMLVideoElement;

    private _videoChanged()
    {
        this._pixels = this.video;
        this.invalidate();
    }
}
