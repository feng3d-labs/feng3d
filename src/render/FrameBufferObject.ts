namespace feng3d
{
    /**
     * 帧缓冲对象
     * @author feng 2017-02-18
     */
    export class FrameBufferObject
    {
        @watch("invalidate")
        OFFSCREEN_WIDTH = 1024;

        @watch("invalidate")
        OFFSCREEN_HEIGHT = 1024;

        frameBuffer: FrameBuffer;
        texture: RenderTargetTexture2D;
        depthBuffer: RenderBuffer;

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

        constructor(width = 1024, height = 1024)
        {
            this.OFFSCREEN_WIDTH = width;
            this.OFFSCREEN_HEIGHT = height;
            //
            this.frameBuffer = new FrameBuffer();
            //
            this.texture = new RenderTargetTexture2D();
            this.texture.OFFSCREEN_WIDTH = width;
            this.texture.OFFSCREEN_HEIGHT = height;
            //
            this.depthBuffer = new RenderBuffer();
            this.depthBuffer.OFFSCREEN_WIDTH = width;
            this.depthBuffer.OFFSCREEN_HEIGHT = height;
        }

        active(gl: GL)
        {
            var framebuffer = this.frameBuffer.active(gl);
            if (this._invalid)
            {
                this._invalid = false;
                this.texture.OFFSCREEN_WIDTH = this.OFFSCREEN_WIDTH;
                this.texture.OFFSCREEN_HEIGHT = this.OFFSCREEN_HEIGHT;
                this.depthBuffer.OFFSCREEN_WIDTH = this.OFFSCREEN_WIDTH;
                this.depthBuffer.OFFSCREEN_HEIGHT = this.OFFSCREEN_HEIGHT;
                //
                var texture = this.texture.active(gl);
                var depthBuffer = this.depthBuffer.active(gl);

                // Attach the texture and the renderbuffer object to the FBO
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

                // Check if FBO is configured correctly
                var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                if (gl.FRAMEBUFFER_COMPLETE !== e)
                {
                    debuger && alert('Frame buffer object is incomplete: ' + e.toString());
                    return null;
                }
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            return framebuffer;
        }

        deactive(gl: GL)
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }

}