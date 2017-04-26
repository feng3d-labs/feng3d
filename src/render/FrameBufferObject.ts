module feng3d
{
    /**
     * 帧缓冲对象
     * @author feng 2017-02-18
     */
    export class FrameBufferObject
    {
        OFFSCREEN_WIDTH = 1024;
        OFFSCREEN_HEIGHT = 1024;

        framebuffer: WebGLFramebuffer;
        texture: WebGLTexture;
        depthBuffer: WebGLRenderbuffer;

        t: Texture2D;

        init(gl: GL)
        {
            // Create a framebuffer object (FBO)
            this.framebuffer = gl.createFramebuffer();
            if (!this.framebuffer)
            {
                debuger && alert('Failed to create frame buffer object');
                return this.clear(gl);
            }

            // Create a texture object and set its size and parameters
            this.texture = gl.createTexture(); // Create a texture object
            if (!this.texture)
            {
                debuger && alert('Failed to create texture object');
                return this.clear(gl);
            }
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            // Create a renderbuffer object and Set its size and parameters
            this.depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
            if (!this.depthBuffer)
            {
                debuger && alert('Failed to create renderbuffer object');
                return this.clear(gl);
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT);

            // Attach the texture and the renderbuffer object to the FBO
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);

            // Check if FBO is configured correctly
            var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (gl.FRAMEBUFFER_COMPLETE !== e)
            {
                debuger && alert('Frame buffer object is incomplete: ' + e.toString());
                return this.clear(gl);
            }

            // Unbind the buffer object
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }

        public active(gl: GL)
        {
            gl.bindFramebuffer(GL.FRAMEBUFFER, this.framebuffer);
        }

        public deactive(gl: GL)
        {
            gl.bindFramebuffer(GL.FRAMEBUFFER, null);
        }

        clear(gl: GL)
        {
            if (this.framebuffer) gl.deleteFramebuffer(this.framebuffer);
            if (this.texture) gl.deleteTexture(this.texture);
            if (this.depthBuffer) gl.deleteRenderbuffer(this.depthBuffer);
            return null;
        }
    }

}