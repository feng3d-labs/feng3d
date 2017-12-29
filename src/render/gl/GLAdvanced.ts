namespace feng3d
{
    /**
     * WebWG2.0 或者 扩展功能
     */
    export class GLAdvanced
    {
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced
         */
        drawElementsInstanced: (mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei) => void;

        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor
         */
        vertexAttribDivisor: (index: GLuint, divisor: GLuint) => void;

        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced
         */
        drawArraysInstanced: (mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei) => void;

        constructor(gl: GL)
        {
            assert(!gl.advanced, `${gl} ${gl.advanced} 存在！`);
            
            gl.advanced = this;
            var gl2: WebGL2RenderingContext = <any>gl;
            this.drawElementsInstanced = (mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei) =>
            {
                if (gl.webgl2)
                {
                    gl2.drawElementsInstanced(mode, count, type, offset, instanceCount);
                } else if (!!gl.extensions.aNGLEInstancedArrays)
                {
                    gl.extensions.aNGLEInstancedArrays.drawElementsInstancedANGLE(mode, count, type, offset, instanceCount);
                } else
                {
                    warn(`浏览器 不支持 drawElementsInstanced ！`);
                }
            }
            this.vertexAttribDivisor = (index: GLuint, divisor: GLuint) => 
            {
                if (gl.webgl2)
                {
                    gl2.vertexAttribDivisor(index, divisor);
                } else if (!!gl.extensions.aNGLEInstancedArrays)
                {
                    gl.extensions.aNGLEInstancedArrays.vertexAttribDivisorANGLE(index, divisor);
                } else
                {
                    warn(`浏览器 不支持 vertexAttribDivisor ！`);
                }
            }
            this.drawArraysInstanced = (mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei) => 
            {
                if (gl.webgl2)
                {
                    gl2.drawArraysInstanced(mode, first, count, instanceCount);
                } else if (!!gl.extensions.aNGLEInstancedArrays)
                {
                    gl.extensions.aNGLEInstancedArrays.drawArraysInstancedANGLE(mode, first, count, instanceCount);
                } else
                {
                    warn(`浏览器 不支持 drawArraysInstanced ！`);
                }
            }
        }
    }
}