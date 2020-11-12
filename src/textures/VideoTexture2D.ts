namespace feng3d
{
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
}