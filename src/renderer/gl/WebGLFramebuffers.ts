import { FrameBuffer } from '../FrameBuffer';
import { WebGLRenderer } from '../WebGLRenderer';
import { FramebufferTarget } from './WebGLEnums';

declare global
{
    /**
     * WebGLFramebuffer 接口时 WebGL API 的一部分，它提供了一个缓冲区的集合，这些缓冲区可以作为一个整体用作渲染操作的目标缓冲区。
     *
     * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLFramebuffer
     */
    interface WebGLFramebuffer
    {
        /**
         * 附加到帧缓冲的0号颜色缓冲上的纹理。
         *
         * Attaches the texture to the framebuffer's color buffer.
         */
        texture: WebGLTexture;

        /**
         * 附加到帧缓冲上的深度缓冲。
         *
         * Attaches the texture to the framebuffer's depth buffer.
         */
        depthBuffer: WebGLRenderbuffer;
    }
}

/**
 * WebGLFramebuffer管理器。
 *
 * 负责
 */
export class WebGLFramebuffers
{
    /**
     * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
     */
    private _cache = new Map<FrameBuffer, WebGLFramebuffer>();

    private _webGLRenderer: WebGLRenderer;

    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;
    }

    active(frameBuffer: FrameBuffer)
    {
        const { renderbuffers, textures, webGLContext } = this._webGLRenderer;

        const target: FramebufferTarget = 'FRAMEBUFFER';

        if (!frameBuffer)
        {
            webGLContext.bindFramebuffer(target, null);

            return;
        }

        const webGLFramebuffer = this.get(frameBuffer);

        // 绑定帧缓冲区对象
        webGLContext.bindFramebuffer(target, webGLFramebuffer);

        let needCheck = false;

        // 设置颜色关联对象
        const texture = textures.get(frameBuffer.texture);
        if (webGLFramebuffer.texture !== texture)
        {
            webGLContext.framebufferTexture2D(target, 'COLOR_ATTACHMENT0', 'TEXTURE_2D', texture, 0);
            webGLFramebuffer.texture = texture;

            needCheck = true;
        }

        // 设置深度关联对象
        const depthBuffer = renderbuffers.get(frameBuffer.depthBuffer);
        if (webGLFramebuffer.depthBuffer !== depthBuffer)
        {
            webGLContext.framebufferRenderbuffer(target, 'DEPTH_ATTACHMENT', 'RENDERBUFFER', depthBuffer);
            webGLFramebuffer.depthBuffer = depthBuffer;

            needCheck = true;
        }

        if (needCheck)
        {
            // 检查Framebuffer状态
            const e = webGLContext.checkFramebufferStatus(target);
            if (webGLContext.FRAMEBUFFER_COMPLETE !== e)
            {
                console.warn(`Frame buffer object is incomplete: ${e.toString()}`);

                return null;
            }
        }

        return webGLFramebuffer;
    }

    private get(frameBuffer: FrameBuffer)
    {
        const { webGLContext } = this._webGLRenderer;
        const { _cache: frameBuffers } = this;

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
        const { _cache: frameBuffers } = this;

        const buffer = frameBuffers.get(frameBuffer);
        if (buffer)
        {
            webGLContext.deleteFramebuffer(buffer);
            frameBuffers.delete(frameBuffer);
        }
    }
}
