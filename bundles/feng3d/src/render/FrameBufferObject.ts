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

        active(gl: GL)
        {
            if (this._invalid)
            {
                this._invalid = false;
                this.clear();
            }

            var obj = this._map.get(gl);
            if (!obj)
            {
                var framebuffer = this.frameBuffer.active(gl);
                var texture = this.texture.active(gl);
                var depthBuffer = this.depthBuffer.active(gl);

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
                    debuger && alert('Frame buffer object is incomplete: ' + e.toString());
                    return null;
                }

                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                
                obj = { framebuffer: framebuffer, texture: texture, depthBuffer: depthBuffer };
                this._map.set(gl, obj);
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

        private _map = new Map<GL, {
            framebuffer: WebGLFramebuffer, texture: WebGLTexture, depthBuffer: WebGLRenderbuffer
        }>();

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

        private clear()
        {
            this._map.clear();
        }
    }

}