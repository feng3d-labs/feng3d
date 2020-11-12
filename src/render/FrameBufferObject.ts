namespace feng3d
{
    /**
     * 帧缓冲对象
     */
    export class FrameBufferObject
    {
        @watch("invalidateSize")
        OFFSCREEN_WIDTH = 1024;

        @watch("invalidateSize")
        OFFSCREEN_HEIGHT = 1024;

        @watch("invalidate")
        frameBuffer: FrameBuffer;

        @watch("invalidate")
        texture: RenderTargetTexture2D;

        @watch("invalidate")
        depthBuffer: RenderBuffer;

        constructor(width = 1024, height = 1024)
        {
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
            var obj = gl.cache.frameBufferObjects.get(frameBufferObject);
            if (!obj)
            {
                var framebuffer = FrameBuffer.active(gl, frameBufferObject.frameBuffer);
                var texture = Texture.active(gl, frameBufferObject.texture);
                var depthBuffer = RenderBuffer.active(gl, frameBufferObject.depthBuffer);

                // 绑定帧缓冲区对象
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                // 设置颜色关联对象
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
                // 设置深度关联对象
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

                // 检查Framebuffer状态
                var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                if (gl.FRAMEBUFFER_COMPLETE !== e)
                {
                    alert('Frame buffer object is incomplete: ' + e.toString());
                    return null;
                }

                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);

                obj = { framebuffer: framebuffer, texture: texture, depthBuffer: depthBuffer };
                gl.cache.frameBufferObjects.set(frameBufferObject, obj);
            } else
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
            GL.glList.forEach(gl =>
            {
                gl.cache.frameBufferObjects = gl.cache.frameBufferObjects || new Map();

                var buffer = gl.cache.frameBufferObjects.get(frameBufferObject);
                if (buffer)
                {
                    gl.cache.frameBufferObjects.delete(frameBufferObject);
                }
            });
        }
    }

    export interface GLCache
    {
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        frameBufferObjects: Map<FrameBufferObject, {
            framebuffer: WebGLFramebuffer, texture: WebGLTexture, depthBuffer: WebGLRenderbuffer
        }>;
    }
}