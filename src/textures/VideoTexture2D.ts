namespace feng3d
{
    export class VideoTexture2D extends Texture2D
    {
        @watch("videoChanged")
        video: HTMLVideoElement;

        constructor(raw?: gPartial<VideoTexture2D>)
        {
            super(raw);
        }

        private videoChanged()
        {
            this._pixels = this.video;
            this.invalidate();
        }
    }
}