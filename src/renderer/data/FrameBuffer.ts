namespace feng3d
{
    export class FrameBuffer
    {
        /**
         * 是否失效
         */
        private _invalid = true;

        static active(gl: GL, frameBuffer: FrameBuffer)
        {
            if (frameBuffer._invalid)
            {
                frameBuffer._invalid = false;
                this.clear(frameBuffer);
            }

            // Create a framebuffer object (FBO)
            var buffer = gl.cache.frameBuffers.get(frameBuffer);
            if (!buffer)
            {
                buffer = gl.createFramebuffer();
                if (!buffer)
                {
                    alert('Failed to create frame buffer object');
                    return null;
                }
                gl.cache.frameBuffers.set(frameBuffer, buffer);
            }
            return buffer;
        }

        /**
         * 清理缓存
         */
        static clear(frameBuffer: FrameBuffer)
        {
            GL.glList.forEach(gl =>
            {
                var buffer = gl.cache.frameBuffers.get(frameBuffer);
                if (buffer)
                {
                    gl.deleteFramebuffer(buffer);
                    gl.cache.frameBuffers.delete(frameBuffer);
                }
            });
        }
    }
}