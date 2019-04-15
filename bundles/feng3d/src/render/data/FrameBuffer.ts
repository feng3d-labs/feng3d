namespace feng3d
{
    export class FrameBuffer
    {
        protected _framebufferMap = new Map<GL, WebGLFramebuffer>();

        /**
         * 是否失效
         */
        private _invalid = true;

        active(gl: GL)
        {
            if (this._invalid)
            {
                this._invalid = false;
                this.clear();
            }

            // Create a framebuffer object (FBO)
            var framebuffer = this._framebufferMap.get(gl);
            if (!framebuffer)
            {
                framebuffer = gl.createFramebuffer();
                if (!framebuffer)
                {
                    debuger && alert('Failed to create frame buffer object');
                    return null;
                }
                this._framebufferMap.set(gl, framebuffer);
            }
            return framebuffer;
        }

        /**
         * 清理缓存
         */
        private clear()
        {
            this._framebufferMap.forEach((v, k) =>
            {
                k.deleteFramebuffer(v);
            });
            this._framebufferMap.clear();
        }
    }
}