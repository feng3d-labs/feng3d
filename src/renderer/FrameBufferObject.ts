import { RenderTargetTexture2D } from '../textures/RenderTargetTexture2D';
import { watcher } from '../watcher/watcher';
import { FrameBuffer } from './data/FrameBuffer';
import { FramebufferTarget } from './gl/WebGLEnums';
import { RenderBuffer } from './RenderBuffer';
import { WebGLRenderer } from './WebGLRenderer';

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
 * 帧缓冲对象
 */
export class FrameBufferObject
{
    width = 1024;

    height = 1024;

    frameBuffer: FrameBuffer;

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

    /**
     * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
     */
    private static frameBufferObjects = new WeakMap<FrameBufferObject, WebGLFramebuffer>();

    constructor(width = 1024, height = 1024)
    {
        watcher.watch(this as FrameBufferObject, 'width', this.invalidateSize, this);
        watcher.watch(this as FrameBufferObject, 'height', this.invalidateSize, this);
        watcher.watch(this as FrameBufferObject, 'frameBuffer', this.invalidateSize, this);
        watcher.watch(this as FrameBufferObject, 'texture', this.invalidateSize, this);
        watcher.watch(this as FrameBufferObject, 'depthBuffer', this.invalidateSize, this);
        //
        this.frameBuffer = new FrameBuffer();
        this.texture = new RenderTargetTexture2D();
        this.depthBuffer = new RenderBuffer();
        this.width = width;
        this.height = height;
    }

    active(webGLRenderer: WebGLRenderer)
    {
        const { renderbuffers, framebuffers, textures, webGLContext } = webGLRenderer;
        if (this._invalid)
        {
            this.clear();
        }

        const target: FramebufferTarget = 'FRAMEBUFFER';

        let framebuffer = FrameBufferObject.frameBufferObjects.get(this);
        if (!framebuffer)
        {
            framebuffer = framebuffers.active(this.frameBuffer);
            FrameBufferObject.frameBufferObjects.set(this, framebuffer);
        }

        // 绑定帧缓冲区对象
        webGLContext.bindFramebuffer(target, framebuffer);

        // 设置颜色关联对象
        const texture = textures.getTexture(this.texture);
        if (framebuffer.texture !== texture)
        {
            webGLContext.framebufferTexture2D(target, 'COLOR_ATTACHMENT0', 'TEXTURE_2D', texture, 0);
            framebuffer.texture = texture;
        }

        // 设置深度关联对象
        const depthBuffer = renderbuffers.active(this.depthBuffer);
        if (framebuffer.depthBuffer !== depthBuffer)
        {
            webGLContext.framebufferRenderbuffer(target, 'DEPTH_ATTACHMENT', 'RENDERBUFFER', depthBuffer);
            framebuffer.depthBuffer = depthBuffer;
        }

        if (this._invalid)
        {
            // 检查Framebuffer状态
            const e = webGLContext.checkFramebufferStatus(target);
            if (webGLContext.FRAMEBUFFER_COMPLETE !== e)
            {
                console.warn(`Frame buffer object is incomplete: ${e.toString()}`);

                return null;
            }
        }

        this._invalid = false;

        return framebuffer;
    }

    deactive(webGLRenderer: WebGLRenderer)
    {
        webGLRenderer.webGLContext.bindFramebuffer('FRAMEBUFFER', null);
    }

    /**
     * 是否失效
     */
    private _invalid = true;

    /**
     * 使失效
     */
    protected invalidate()
    {
        this._invalid = true;
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
        this._invalid = true;
    }

    clear()
    {
        const buffer = FrameBufferObject.frameBufferObjects.get(this);
        if (buffer)
        {
            FrameBufferObject.frameBufferObjects.delete(this);
        }
    }
}
