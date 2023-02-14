import { FrameBuffer } from '../data/FrameBuffer';
import { WebGLRenderer } from '../WebGLRenderer';

export class WebGLFramebuffers
{
    /**
     * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
     */
    private frameBuffers = new Map<FrameBuffer, WebGLFramebuffer>();

    private _webGLRenderer: WebGLRenderer;

    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;
    }

    active(frameBuffer: FrameBuffer)
    {
        const { webGLContext } = this._webGLRenderer;
        const { frameBuffers } = this;

        if (frameBuffer.invalid)
        {
            frameBuffer.invalid = false;
            this.clear(frameBuffer);
        }

        // Create a framebuffer object (FBO)
        let buffer = frameBuffers.get(frameBuffer);
        if (!buffer)
        {
            buffer = webGLContext.createFramebuffer();
            if (!buffer)
            {
                console.warn('Failed to create frame buffer object');

                return null;
            }
            frameBuffers.set(frameBuffer, buffer);
        }

        return buffer;
    }

    /**
     * 清理缓存
     */
    private clear(frameBuffer: FrameBuffer)
    {
        const { webGLContext } = this._webGLRenderer;
        const { frameBuffers } = this;

        const buffer = frameBuffers.get(frameBuffer);
        if (buffer)
        {
            webGLContext.deleteFramebuffer(buffer);
            frameBuffers.delete(frameBuffer);
        }
    }
}
