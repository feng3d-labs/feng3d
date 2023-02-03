import { VertexAttributeIntegerTypes } from './data/AttributeBuffer';
import { WebGLContextOverloads } from './WebGLContextOverloads';

/**
 * WebGL上下文。
 *
 * 对应 lib.dom.d.ts 中 WebGLRenderingContext 接口。
 */
export class WebGLContext extends WebGLContextOverloads
{
    /**
     * The WebGL2RenderingContext.vertexAttribIPointer() method of the WebGL 2 API specifies integer data formats and locations of vertex attributes in a vertex attributes array.
     *
     * @param index A GLuint specifying the index of the vertex attribute that is to be modified.
     * @param size A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
     * @param type A GLenum specifying the data type of each component in the array. Must be one of: gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.INT, or gl.UNSIGNED_INT.
     * @param stride A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes.
     * @param offset A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of type.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribIPointer
     */
    vertexAttribIPointer(index: GLuint, size: 1 | 2 | 3 | 4, type: VertexAttributeIntegerTypes, stride: GLsizei, offset: GLintptr): void
    {
        const { gl2 } = this._webGLRenderer;
        gl2.vertexAttribIPointer(index, size, gl2[type], stride, offset);
    }
}
