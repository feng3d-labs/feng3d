namespace feng3d
{
    export class VideoTexture2D extends Texture2D
    {
        @watch("videoChanged")
        video: HTMLVideoElement;

        private videoChanged()
        {
            this._pixels = this.video;
            this.invalidate();
        }
    }
}