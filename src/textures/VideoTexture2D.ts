namespace feng3d
{
    export class VideoTexture2D extends Texture2D
    {
        get video()
        {
            return this._video;
        }
        set video(v)
        {
            if (this._video == v) return;
            this._video = v;
            this.videoChanged();
        }
        private _video: HTMLVideoElement;

        private videoChanged()
        {
            this._pixels = this.video;
            this.invalidate();
        }
    }
}