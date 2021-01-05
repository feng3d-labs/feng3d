namespace feng3d
{
    export class RenderBuffer
    {

        @watch("invalidate")
        OFFSCREEN_WIDTH = 1024;

        @watch("invalidate")
        OFFSCREEN_HEIGHT = 1024;

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
        static active(gl: GL, renderBuffer: RenderBuffer)
        {
            if (renderBuffer._invalid)
            {
                this.clear(renderBuffer);
                renderBuffer._invalid = false;
            }

            var buffer = gl.cache.renderBuffers.get(renderBuffer);
            if (!buffer)
            {
                // Create a renderbuffer object and Set its size and parameters
                buffer = gl.createRenderbuffer(); // Create a renderbuffer object
                if (!buffer)
                {
                    alert('Failed to create renderbuffer object');
                    return;
                }
                gl.cache.renderBuffers.set(renderBuffer, buffer);
                gl.bindRenderbuffer(gl.RENDERBUFFER, buffer);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, renderBuffer.OFFSCREEN_WIDTH, renderBuffer.OFFSCREEN_HEIGHT);
            }
            return buffer;
        }

        /**
         * 清理纹理
         */
        static clear(renderBuffer: RenderBuffer)
        {
            GL.glList.forEach(gl =>
            {
                var buffer = gl.cache.renderBuffers.get(renderBuffer);
                if (buffer)
                {
                    gl.deleteRenderbuffer(buffer);
                    gl.cache.renderBuffers.delete(renderBuffer);
                }
            });
        }
    }
}