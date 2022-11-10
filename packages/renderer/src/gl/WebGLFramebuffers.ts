import { FrameBuffer } from '../data/FrameBuffer';

export class WebGLFramebuffers
{
    private gl: WebGLRenderingContext;

    /**
     * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
     */
    private frameBuffers = new Map<FrameBuffer, WebGLFramebuffer>();

    constructor(gl: WebGLRenderingContext)
    {
        this.gl = gl;
    }

    active(frameBuffer: FrameBuffer)
    {
        const { gl, frameBuffers } = this;

        if (frameBuffer.invalid)
        {
            frameBuffer.invalid = false;
            this.clear(frameBuffer);
        }

        // Create a framebuffer object (FBO)
        let buffer = frameBuffers.get(frameBuffer);
        if (!buffer)
        {
            buffer = gl.createFramebuffer();
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
        const { gl, frameBuffers } = this;

        const buffer = frameBuffers.get(frameBuffer);
        if (buffer)
        {
            gl.deleteFramebuffer(buffer);
            frameBuffers.delete(frameBuffer);
        }
    }
}
