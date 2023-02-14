import { VertexAttributeIntegerTypes } from './data/AttributeBuffer';
import { DrawElementType } from './data/ElementBuffer';
import { DrawMode } from './data/RenderParams';
import { WebGLContextOverloads } from './WebGLContextOverloads';

/**
 * 对应 lib.dom.d.ts 中 WebGL2RenderingContextBase 接口。
 */
export class WebGL2ContextBase extends WebGLContextOverloads
{
    // beginQuery(target: GLenum, query: WebGLQuery): void;
    // beginTransformFeedback(primitiveMode: GLenum): void;
    // bindBufferBase(target: GLenum, index: GLuint, buffer: WebGLBuffer | null): void;
    // bindBufferRange(target: GLenum, index: GLuint, buffer: WebGLBuffer | null, offset: GLintptr, size: GLsizeiptr): void;
    // bindSampler(unit: GLuint, sampler: WebGLSampler | null): void;
    // bindTransformFeedback(target: GLenum, tf: WebGLTransformFeedback | null): void;

    /**
     * The WebGL2RenderingContext.bindVertexArray() method of the WebGL 2 API binds a passed WebGLVertexArrayObject object to the buffer.
     *
     * @param array A WebGLVertexArrayObject (VAO) object to bind.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindVertexArray
     */
    bindVertexArray(array: WebGLVertexArrayObject | null): void
    {
        const { gl2, isWebGL2, extensions } = this._webGLRenderer;

        if (isWebGL2) return gl2.bindVertexArray(array);

        const extension = extensions.getExtension('OES_vertex_array_object');
        extension.bindVertexArrayOES(array);
    }

    // blitFramebuffer(srcX0: GLint, srcY0: GLint, srcX1: GLint, srcY1: GLint, dstX0: GLint, dstY0: GLint, dstX1: GLint, dstY1: GLint, mask: GLbitfield, filter: GLenum): void;
    // clearBufferfi(buffer: GLenum, drawbuffer: GLint, depth: GLfloat, stencil: GLint): void;
    // clearBufferfv(buffer: GLenum, drawbuffer: GLint, values: Float32List, srcOffset?: GLuint): void;
    // clearBufferiv(buffer: GLenum, drawbuffer: GLint, values: Int32List, srcOffset?: GLuint): void;
    // clearBufferuiv(buffer: GLenum, drawbuffer: GLint, values: Uint32List, srcOffset?: GLuint): void;
    // clientWaitSync(sync: WebGLSync, flags: GLbitfield, timeout: GLuint64): GLenum;
    // compressedTexImage3D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, imageSize: GLsizei, offset: GLintptr): void;
    // compressedTexImage3D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, srcData: ArrayBufferView, srcOffset?: GLuint, srcLengthOverride?: GLuint): void;
    // compressedTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, imageSize: GLsizei, offset: GLintptr): void;
    // compressedTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, srcData: ArrayBufferView, srcOffset?: GLuint, srcLengthOverride?: GLuint): void;
    // copyBufferSubData(readTarget: GLenum, writeTarget: GLenum, readOffset: GLintptr, writeOffset: GLintptr, size: GLsizeiptr): void;
    // copyTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, x: GLint, y: GLint, width: GLsizei, height: GLsizei): void;
    // createQuery(): WebGLQuery | null;
    // createSampler(): WebGLSampler | null;
    // createTransformFeedback(): WebGLTransformFeedback | null;

    /**
     * The WebGL2RenderingContext.createVertexArray() method of the WebGL 2 API creates and initializes a WebGLVertexArrayObject object that represents a vertex array object (VAO) pointing to vertex array data and which provides names for different sets of vertex data.
     *
     * @returns A WebGLVertexArrayObject representing a vertex array object (VAO) which points to vertex array data.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/createVertexArray
     */
    createVertexArray(): WebGLVertexArrayObject | null
    {
        const { gl2, isWebGL2, extensions } = this._webGLRenderer;

        if (isWebGL2)
        {
            return gl2.createVertexArray();
        }

        const extension = extensions.getExtension('OES_vertex_array_object');

        return extension.createVertexArrayOES();
    }

    // deleteQuery(query: WebGLQuery | null): void;
    // deleteSampler(sampler: WebGLSampler | null): void;
    // deleteSync(sync: WebGLSync | null): void;
    // deleteTransformFeedback(tf: WebGLTransformFeedback | null): void;
    // deleteVertexArray(vertexArray: WebGLVertexArrayObject | null): void;

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
        const { gl2, isWebGL2, extensions } = this._webGLRenderer;
        if (isWebGL2)
        {
            gl2.drawArraysInstanced(gl2[mode], first, count, instanceCount);

            return;
        }

        const extension = extensions.getExtension('ANGLE_instanced_arrays');
        extension.drawArraysInstancedANGLE(gl2[mode], first, count, instanceCount);
    }

    // drawBuffers(buffers: GLenum[]): void;

    /**
     * The WebGL2RenderingContext.drawElementsInstanced() method of the WebGL 2 API renders primitives from array data like the gl.drawElements() method. In addition, it can execute multiple instances of a set of elements.
     *
     * @param mode A GLenum specifying the type primitive to render.
     * @param count A GLsizei specifying the number of elements to be rendered.
     * @param type A GLenum specifying the type of the values in the element array buffer.
     * @param offset A GLintptr specifying an offset in the element array buffer. Must be a valid multiple of the size of the given type.
     * @param instanceCount A GLsizei specifying the number of instances of the set of elements to execute.
     */
    drawElementsInstanced(mode: DrawMode, count: GLsizei, type: DrawElementType, offset: GLintptr, instanceCount: GLsizei): void
    {
        const { isWebGL2, gl2, extensions } = this._webGLRenderer;
        if (isWebGL2)
        {
            gl2.drawElementsInstanced(gl2[mode], count, gl2[type], offset, instanceCount);
        }
        else
        {
            const extension = extensions.getExtension('ANGLE_instanced_arrays');
            extension.drawElementsInstancedANGLE(gl2[mode], count, gl2[type], offset, instanceCount);
        }
    }

    // drawRangeElements(mode: GLenum, start: GLuint, end: GLuint, count: GLsizei, type: GLenum, offset: GLintptr): void;
    // endQuery(target: GLenum): void;
    // endTransformFeedback(): void;
    // fenceSync(condition: GLenum, flags: GLbitfield): WebGLSync | null;
    // framebufferTextureLayer(target: GLenum, attachment: GLenum, texture: WebGLTexture | null, level: GLint, layer: GLint): void;
    // getActiveUniformBlockName(program: WebGLProgram, uniformBlockIndex: GLuint): string | null;
    // getActiveUniformBlockParameter(program: WebGLProgram, uniformBlockIndex: GLuint, pname: GLenum): any;
    // getActiveUniforms(program: WebGLProgram, uniformIndices: GLuint[], pname: GLenum): any;
    // getBufferSubData(target: GLenum, srcByteOffset: GLintptr, dstBuffer: ArrayBufferView, dstOffset?: GLuint, length?: GLuint): void;
    // getFragDataLocation(program: WebGLProgram, name: string): GLint;
    // getIndexedParameter(target: GLenum, index: GLuint): any;
    // getInternalformatParameter(target: GLenum, internalformat: GLenum, pname: GLenum): any;
    // getQuery(target: GLenum, pname: GLenum): WebGLQuery | null;
    // getQueryParameter(query: WebGLQuery, pname: GLenum): any;
    // getSamplerParameter(sampler: WebGLSampler, pname: GLenum): any;
    // getSyncParameter(sync: WebGLSync, pname: GLenum): any;
    // getTransformFeedbackVarying(program: WebGLProgram, index: GLuint): WebGLActiveInfo | null;
    // getUniformBlockIndex(program: WebGLProgram, uniformBlockName: string): GLuint;
    // getUniformIndices(program: WebGLProgram, uniformNames: string[]): GLuint[] | null;
    // invalidateFramebuffer(target: GLenum, attachments: GLenum[]): void;
    // invalidateSubFramebuffer(target: GLenum, attachments: GLenum[], x: GLint, y: GLint, width: GLsizei, height: GLsizei): void;
    // isQuery(query: WebGLQuery | null): GLboolean;
    // isSampler(sampler: WebGLSampler | null): GLboolean;
    // isSync(sync: WebGLSync | null): GLboolean;
    // isTransformFeedback(tf: WebGLTransformFeedback | null): GLboolean;
    // isVertexArray(vertexArray: WebGLVertexArrayObject | null): GLboolean;
    // pauseTransformFeedback(): void;
    // readBuffer(src: GLenum): void;
    // renderbufferStorageMultisample(target: GLenum, samples: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei): void;
    // resumeTransformFeedback(): void;
    // samplerParameterf(sampler: WebGLSampler, pname: GLenum, param: GLfloat): void;
    // samplerParameteri(sampler: WebGLSampler, pname: GLenum, param: GLint): void;
    // texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, pboOffset: GLintptr): void;
    // texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, source: TexImageSource): void;
    // texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView | null): void;
    // texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: GLuint): void;
    // texStorage2D(target: GLenum, levels: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei): void;
    // texStorage3D(target: GLenum, levels: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei): void;
    // texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, pboOffset: GLintptr): void;
    // texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, source: TexImageSource): void;
    // texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, srcData: ArrayBufferView | null, srcOffset?: GLuint): void;
    // transformFeedbackVaryings(program: WebGLProgram, varyings: string[], bufferMode: GLenum): void;
    // uniform1ui(location: WebGLUniformLocation | null, v0: GLuint): void;
    // uniform1uiv(location: WebGLUniformLocation | null, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint): void;
    // uniform2ui(location: WebGLUniformLocation | null, v0: GLuint, v1: GLuint): void;
    // uniform2uiv(location: WebGLUniformLocation | null, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint): void;
    // uniform3ui(location: WebGLUniformLocation | null, v0: GLuint, v1: GLuint, v2: GLuint): void;
    // uniform3uiv(location: WebGLUniformLocation | null, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint): void;
    // uniform4ui(location: WebGLUniformLocation | null, v0: GLuint, v1: GLuint, v2: GLuint, v3: GLuint): void;
    // uniform4uiv(location: WebGLUniformLocation | null, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint): void;
    // uniformBlockBinding(program: WebGLProgram, uniformBlockIndex: GLuint, uniformBlockBinding: GLuint): void;
    // uniformMatrix2x3fv(location: WebGLUniformLocation | null, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void;
    // uniformMatrix2x4fv(location: WebGLUniformLocation | null, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void;
    // uniformMatrix3x2fv(location: WebGLUniformLocation | null, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void;
    // uniformMatrix3x4fv(location: WebGLUniformLocation | null, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void;
    // uniformMatrix4x2fv(location: WebGLUniformLocation | null, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void;
    // uniformMatrix4x3fv(location: WebGLUniformLocation | null, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void;

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
        const { gl2, isWebGL2, extensions } = this._webGLRenderer;

        if (isWebGL2)
        {
            gl2.vertexAttribDivisor(index, divisor);

            return;
        }
        const extension = extensions.getExtension('ANGLE_instanced_arrays');
        extension.vertexAttribDivisorANGLE(index, divisor);
    }

    // vertexAttribI4i(index: GLuint, x: GLint, y: GLint, z: GLint, w: GLint): void;
    // vertexAttribI4iv(index: GLuint, values: Int32List): void;
    // vertexAttribI4ui(index: GLuint, x: GLuint, y: GLuint, z: GLuint, w: GLuint): void;
    // vertexAttribI4uiv(index: GLuint, values: Uint32List): void;

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

    // waitSync(sync: WebGLSync, flags: GLbitfield, timeout: GLint64): void;
}
