import { RenderTargetTexture2D } from '../textures/RenderTargetTexture2D';
import { watcher } from '../watcher/watcher';
import { FrameBuffer } from './data/FrameBuffer';
import { FramebufferTarget } from './gl/WebGLEnums';
import { RenderBuffer } from './RenderBuffer';
import { WebGLRenderer } from './WebGLRenderer';

/**
 * 帧缓冲对象
 */
export class FrameBufferObject
{
    OFFSCREEN_WIDTH = 1024;

    OFFSCREEN_HEIGHT = 1024;

    frameBuffer: FrameBuffer;

    texture: RenderTargetTexture2D;

    depthBuffer: RenderBuffer;

    /**
     * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
     */
    private static frameBufferObjects = new WeakMap<FrameBufferObject, {
        framebuffer: WebGLFramebuffer, texture: WebGLTexture, depthBuffer: WebGLRenderbuffer
    }>();

    constructor(width = 1024, height = 1024)
    {
        watcher.watch(this as FrameBufferObject, 'OFFSCREEN_WIDTH', this.invalidateSize, this);
        watcher.watch(this as FrameBufferObject, 'OFFSCREEN_HEIGHT', this.invalidateSize, this);
        watcher.watch(this as FrameBufferObject, 'frameBuffer', this.invalidateSize, this);
        watcher.watch(this as FrameBufferObject, 'texture', this.invalidateSize, this);
        watcher.watch(this as FrameBufferObject, 'depthBuffer', this.invalidateSize, this);
        //
        this.frameBuffer = new FrameBuffer();
        this.texture = new RenderTargetTexture2D();
        this.depthBuffer = new RenderBuffer();
        this.OFFSCREEN_WIDTH = width;
        this.OFFSCREEN_HEIGHT = height;
    }

    static active(webGLRenderer: WebGLRenderer, frameBufferObject: FrameBufferObject)
    {
        const { renderbuffers, framebuffers, textures, webGLContext } = webGLRenderer;
        if (frameBufferObject._invalid)
        {
            frameBufferObject._invalid = false;
            this.clear(frameBufferObject);
        }

        let obj = FrameBufferObject.frameBufferObjects.get(frameBufferObject);
        if (!obj)
        {
            const framebuffer = framebuffers.active(frameBufferObject.frameBuffer);
            const texture = textures.active(frameBufferObject.texture);
            const depthBuffer = renderbuffers.active(frameBufferObject.depthBuffer);

            const target: FramebufferTarget = 'FRAMEBUFFER';

            // 绑定帧缓冲区对象
            webGLContext.bindFramebuffer(target, framebuffer);
            // 设置颜色关联对象
            webGLContext.framebufferTexture2D(target, 'COLOR_ATTACHMENT0', 'TEXTURE_2D', texture, 0);
            // 设置深度关联对象
            webGLContext.framebufferRenderbuffer(target, 'DEPTH_ATTACHMENT', 'RENDERBUFFER', depthBuffer);

            // 检查Framebuffer状态
            const e = webGLContext.checkFramebufferStatus(target);
            if (webGLContext.FRAMEBUFFER_COMPLETE !== e)
            {
                console.warn(`Frame buffer object is incomplete: ${e.toString()}`);

                return null;
            }

            webGLContext.bindTexture('TEXTURE_2D', null);
            webGLContext.bindRenderbuffer('RENDERBUFFER', null);

            obj = { framebuffer, texture, depthBuffer };
            FrameBufferObject.frameBufferObjects.set(frameBufferObject, obj);
        }
        else
        {
            webGLContext.bindFramebuffer('FRAMEBUFFER', obj.framebuffer);
        }

        return obj;
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
            this.texture.OFFSCREEN_WIDTH = this.OFFSCREEN_WIDTH;
            this.texture.OFFSCREEN_HEIGHT = this.OFFSCREEN_HEIGHT;
        }
        if (this.depthBuffer)
        {
            this.depthBuffer.OFFSCREEN_WIDTH = this.OFFSCREEN_WIDTH;
            this.depthBuffer.OFFSCREEN_HEIGHT = this.OFFSCREEN_HEIGHT;
        }
        this._invalid = true;
    }

    static clear(frameBufferObject: FrameBufferObject)
    {
        const buffer = FrameBufferObject.frameBufferObjects.get(frameBufferObject);
        if (buffer)
        {
            FrameBufferObject.frameBufferObjects.delete(frameBufferObject);
        }
    }
}
