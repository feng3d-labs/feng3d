namespace feng3d
{
    /**
     * 帧缓冲对象
     * @author feng 2017-02-18
     */
    export class FrameBufferObject
    {
        OFFSCREEN_WIDTH = 1024;
        OFFSCREEN_HEIGHT = 1024;

        protected _framebufferMap = new Map<GL, WebGLFramebuffer>();
        protected _textureMap = new Map<GL, WebGLTexture>();
        protected _depthBufferMap = new Map<GL, WebGLRenderbuffer>();

        private init(gl: GL)
        {
            if (this._framebufferMap.get(gl))
                return;

            // Create a framebuffer object (FBO)
            var framebuffer = gl.createFramebuffer();
            if (!framebuffer)
            {
                debuger && alert('Failed to create frame buffer object');
                return this.clear(gl);
            }

            // Create a texture object and set its size and parameters
            var texture = gl.createTexture(); // Create a texture object
            if (!texture)
            {
                debuger && alert('Failed to create texture object');
                return this.clear(gl);
            }
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            // Create a renderbuffer object and Set its size and parameters
            var depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
            if (!depthBuffer)
            {
                debuger && alert('Failed to create renderbuffer object');
                return this.clear(gl);
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT);

            // Attach the texture and the renderbuffer object to the FBO
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

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


            this._framebufferMap.set(gl, framebuffer);
            this._textureMap.set(gl, texture);
            this._depthBufferMap.set(gl, depthBuffer);
        }

        active(gl: GL)
        {
            this.init(gl);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebufferMap.get(gl));
        }

        deactive(gl: GL)
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        clear(gl: GL)
        {
            if (this._framebufferMap.has(gl))
            {
                gl.deleteFramebuffer(this._framebufferMap.get(gl));
                this._framebufferMap.delete(gl);
            }
            if (this._textureMap.has(gl))
            {
                gl.deleteTexture(this._textureMap.get(gl));
                this._textureMap.delete(gl);
            }
            if (this._depthBufferMap.has(gl))
            {
                gl.deleteRenderbuffer(this._depthBufferMap.get(gl));
                this._depthBufferMap.delete(gl);
            }
            return null;
        }
    }

}