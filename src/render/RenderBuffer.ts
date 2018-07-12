namespace feng3d
{
    export class RenderBuffer
    {
        @watch("invalidate")
        OFFSCREEN_WIDTH = 1024;

        @watch("invalidate")
        OFFSCREEN_HEIGHT = 1024;

        protected _depthBufferMap = new Map<GL, WebGLRenderbuffer>();

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

        /**
         * 激活
         * @param gl 
         */
        active(gl: GL)
        {
            if (this._invalid)
            {
                this.clear();
                this._invalid = false;
            }

            var depthBuffer = this._depthBufferMap.get(gl);
            if (!depthBuffer)
            {
                // Create a renderbuffer object and Set its size and parameters
                depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
                if (!depthBuffer)
                {
                    debuger && alert('Failed to create renderbuffer object');
                    return;
                }
                this._depthBufferMap.set(gl, depthBuffer);
                gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT);
            }
            return depthBuffer;
        }

        /**
         * 清理纹理
         */
        private clear()
        {
            this._depthBufferMap.forEach((v, k) =>
            {
                k.deleteRenderbuffer(v);
            });
            this._depthBufferMap.clear();
        }
    }
}