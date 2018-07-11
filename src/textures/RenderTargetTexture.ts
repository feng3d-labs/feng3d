namespace feng3d
{
    /**
     * 渲染目标纹理
     */
    export class RenderTargetTexture extends TextureInfo
    {
        OFFSCREEN_WIDTH = 1024;
        OFFSCREEN_HEIGHT = 1024;

        constructor(raw?: gPartial<RenderTargetTexture>)
        {
            super(raw);
            this._textureType = TextureType.TEXTURE_2D;
            this._isRenderTarget = true;
        }
    }
}