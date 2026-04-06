import { FrameBuffer } from '../../renderer/data/FrameBuffer';
import { Texture } from '../../renderer/data/Texture';
import { GL } from '../../renderer/gl/GL';
import { RenderBuffer } from '../../renderer/RenderBuffer';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { watcher } from '../../watcher/watcher';
import { RenderTargetTexture2D } from '../textures/RenderTargetTexture2D';

declare global
{
    export interface MixinsGLCache
    {
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        frameBufferObjects: Map<FrameBufferObject, {
            framebuffer: WebGLFramebuffer, texture: WebGLTexture, depthBuffer: WebGLRenderbuffer
        }>;
    }
}

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

    static active(gl: GL, frameBufferObject: FrameBufferObject)
    {
        if (frameBufferObject._invalid)
        {
            frameBufferObject._invalid = false;
            this.clear(frameBufferObject);
        }

        gl.cache.frameBufferObjects = gl.cache.frameBufferObjects || new Map();
        let obj = gl.cache.frameBufferObjects.get(frameBufferObject);
        if (!obj)
        {
            const framebuffer = FrameBuffer.active(gl, frameBufferObject.frameBuffer);
            const texture = Texture.active(gl, frameBufferObject.texture);
            const depthBuffer = RenderBuffer.active(gl, frameBufferObject.depthBuffer);

            // 绑定帧缓冲区对象
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            // 设置颜色关联对象
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            // 设置深度关联对象
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

            // 检查Framebuffer状态
            const e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (gl.FRAMEBUFFER_COMPLETE !== e)
            {
                console.warn(`Frame buffer object is incomplete: ${e.toString()}`);

                return null;
            }

            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);

            obj = { framebuffer, texture, depthBuffer };
            gl.cache.frameBufferObjects.set(frameBufferObject, obj);
        }
        else
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, obj.framebuffer);
        }

        return obj;
    }

    deactive(gl: GL)
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
        WebGLRenderer.glList.forEach((gl) =>
        {
            gl.cache.frameBufferObjects = gl.cache.frameBufferObjects || new Map();

            const buffer = gl.cache.frameBufferObjects.get(frameBufferObject);
            if (buffer)
            {
                gl.cache.frameBufferObjects.delete(frameBufferObject);
            }
        });
    }
}
