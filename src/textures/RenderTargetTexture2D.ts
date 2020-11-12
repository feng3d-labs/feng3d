namespace feng3d
{
    /**
     * 渲染目标纹理
     */
    export class RenderTargetTexture2D extends Texture2D
    {
        @watch("invalidate")
        OFFSCREEN_WIDTH = 1024;

        @watch("invalidate")
        OFFSCREEN_HEIGHT = 1024;

        format = TextureFormat.RGBA;

        minFilter = TextureMinFilter.NEAREST;

        magFilter = TextureMagFilter.NEAREST;

        isRenderTarget = true;
    }
}