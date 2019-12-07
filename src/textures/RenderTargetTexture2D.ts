namespace feng3d
{
    /**
     * 渲染目标纹理
     */
    export class RenderTargetTexture2D extends Texture2D
    {
        get OFFSCREEN_WIDTH()
        {
            return this._OFFSCREEN_WIDTH;
        }
        set OFFSCREEN_WIDTH(v)
        {
            if (this._OFFSCREEN_WIDTH == v) return;
            this._OFFSCREEN_WIDTH = v;
            this.invalidate();
        }
        protected _OFFSCREEN_WIDTH = 1024;

        get OFFSCREEN_HEIGHT()
        {
            return this._OFFSCREEN_HEIGHT;
        }
        set OFFSCREEN_HEIGHT(v)
        {
            if (this._OFFSCREEN_HEIGHT == v) return;
            this._OFFSCREEN_HEIGHT = v;
            this.invalidate();
        }
        protected _OFFSCREEN_HEIGHT = 1024;

        format = TextureFormat.RGBA;

        minFilter = TextureMinFilter.NEAREST;

        magFilter = TextureMagFilter.NEAREST;

        isRenderTarget = true;
    }
}