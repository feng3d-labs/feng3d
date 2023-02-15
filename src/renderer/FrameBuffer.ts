import { RenderTargetTexture2D } from '../textures/RenderTargetTexture2D';
import { watcher } from '../watcher/watcher';
import { RenderBuffer } from './RenderBuffer';

/**
 * 帧缓冲
 */
export class FrameBuffer
{
    /**
     * 帧缓冲宽度。
     */
    width = 1024;

    /**
     * 帧缓冲高度。
     */
    height = 1024;

    /**
     * 附加到帧缓冲的0号颜色缓冲上的纹理。
     *
     * Attaches the texture to the framebuffer's color buffer.
     */
    texture: RenderTargetTexture2D;

    /**
     * 附加到帧缓冲上的深度缓冲。
     *
     * Attaches the texture to the framebuffer's depth buffer.
     */
    depthBuffer: RenderBuffer;

    constructor(width = 1024, height = 1024)
    {
        watcher.watch(this as FrameBuffer, 'width', this.invalidateSize, this);
        watcher.watch(this as FrameBuffer, 'height', this.invalidateSize, this);
        watcher.watch(this as FrameBuffer, 'texture', this.invalidateSize, this);
        watcher.watch(this as FrameBuffer, 'depthBuffer', this.invalidateSize, this);
        //
        this.texture = new RenderTargetTexture2D();
        this.depthBuffer = new RenderBuffer();
        this.width = width;
        this.height = height;
    }

    private invalidateSize()
    {
        if (this.texture)
        {
            this.texture.width = this.width;
            this.texture.height = this.height;
        }
        if (this.depthBuffer)
        {
            this.depthBuffer.width = this.width;
            this.depthBuffer.height = this.height;
        }
    }
}
