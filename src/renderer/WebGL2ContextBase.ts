import { VertexAttributeIntegerTypes } from './data/AttributeBuffer';
import { DrawMode } from './data/RenderParams';
import { WebGLContextOverloads } from './WebGLContextOverloads';

/**
 * 对应 lib.dom.d.ts 中 WebGL2RenderingContextBase 接口。
 */
export class WebGL2ContextBase extends WebGLContextOverloads
{
    /**
     * The WebGL2RenderingContext.bindVertexArray() method of the WebGL 2 API binds a passed WebGLVertexArrayObject object to the buffer.
     *
     * @param array A WebGLVertexArrayObject (VAO) object to bind.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindVertexArray
     */
    bindVertexArray(array: WebGLVertexArrayObject | null): void
    {
        const { gl2, capabilities, extensions } = this._webGLRenderer;

        if (capabilities.isWebGL2) return gl2.bindVertexArray(array);

        const extension = extensions.get('OES_vertex_array_object');
        extension.bindVertexArrayOES(array);
    }

    /**
     * The WebGL2RenderingContext.createVertexArray() method of the WebGL 2 API creates and initializes a WebGLVertexArrayObject object that represents a vertex array object (VAO) pointing to vertex array data and which provides names for different sets of vertex data.
     *
     * @returns A WebGLVertexArrayObject representing a vertex array object (VAO) which points to vertex array data.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/createVertexArray
     */
    createVertexArray(): WebGLVertexArrayObject | null
    {
        const { gl2, capabilities, extensions } = this._webGLRenderer;

        if (capabilities.isWebGL2)
        {
            return gl2.createVertexArray();
        }

        const extension = extensions.get('OES_vertex_array_object');

        return extension.createVertexArrayOES();
    }

    /**
     * The WebGL2RenderingContext.drawArraysInstanced() method of the WebGL 2 API renders primitives from array data like the gl.drawArrays() method. In addition, it can execute multiple instances of the range of elements.
     *
     * @param mode A GLenum specifying the type primitive to render.
     * @param first A GLint specifying the starting index in the array of vector points.
     * @param count A GLsizei specifying the number of indices to be rendered.
     * @param instanceCount A GLsizei specifying the number of instances of the range of elements to execute.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced
     */
    drawArraysInstanced(mode: DrawMode, first: GLint, count: GLsizei, instanceCount: GLsizei): void
    {
        const { gl2, capabilities, extensions } = this._webGLRenderer;
        if (capabilities.isWebGL2)
        {
            gl2.drawArraysInstanced(gl2[mode], first, count, instanceCount);

            return;
        }

        const extension = extensions.get('ANGLE_instanced_arrays');
        extension.drawArraysInstancedANGLE(gl2[mode], first, count, instanceCount);
    }

    /**
     * The WebGL2RenderingContext.vertexAttribDivisor() method of the WebGL 2 API modifies the rate at which generic vertex attributes advance when rendering multiple instances of primitives with gl.drawArraysInstanced() and gl.drawElementsInstanced().
     *
     * @param index A GLuint specifying the index of the generic vertex attributes.
     * @param divisor A GLuint specifying the number of instances that will pass between updates of the generic attribute.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor
     */
    vertexAttribDivisor(index: GLuint, divisor: GLuint): void
    {
        const { gl2, capabilities, extensions } = this._webGLRenderer;

        if (capabilities.isWebGL2)
        {
            gl2.vertexAttribDivisor(index, divisor);

            return;
        }
        const extension = extensions.get('ANGLE_instanced_arrays');
        extension.vertexAttribDivisorANGLE(index, divisor);
    }

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
