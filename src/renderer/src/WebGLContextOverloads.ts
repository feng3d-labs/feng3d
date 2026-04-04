import { BufferTarget, BufferUsage, ReadPixelsFormat, ReadPixelsType, TexImage2DTarget, TextureDataType, TextureFormat } from './gl/WebGLEnums';
import { WebGLContextBase } from './WebGLContextBase';

/**
 * 对应 lib.dom.d.ts 中 WebGLRenderingContextOverloads 接口。
 */
export class WebGLContextOverloads extends WebGLContextBase
{
    // bufferData(target: GLenum, size: GLsizeiptr, usage: GLenum): void;

    /**
     * The WebGLRenderingContext.bufferData() method of the WebGL API initializes and creates the buffer object's data store.
     *
     * @param target A GLenum specifying the binding point (target).
     * @param data An ArrayBuffer, SharedArrayBuffer, a TypedArray or a DataView that will be copied into the data store. If null, a data store is still created, but the content is uninitialized and undefined.
     * @param usage A GLenum specifying the intended usage pattern of the data store for optimization purposes.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
     */
    bufferData(target: BufferTarget, data: BufferSource | null, usage: BufferUsage): void
    {
        const { gl } = this._webGLRenderer;
        gl.bufferData(gl[target], data, gl[usage]);
    }

    // bufferSubData(target: GLenum, offset: GLintptr, data: BufferSource): void;
    // compressedTexImage2D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, border: GLint, data: ArrayBufferView): void;
    // compressedTexSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, data: ArrayBufferView): void;

    /**
     * The WebGLRenderingContext.readPixels() method of the WebGL API reads a block of pixels from a specified rectangle of the current color framebuffer into a TypedArray or a DataView object.
     *
     * @param x A GLint specifying the first horizontal pixel that is read from the lower left corner of a rectangular block of pixels.
     * @param y A GLint specifying the first vertical pixel that is read from the lower left corner of a rectangular block of pixels.
     * @param width A GLsizei specifying the width of the rectangle.
     * @param height A GLsizei specifying the height of the rectangle.
     * @param format A GLenum specifying the format of the pixel data.
     * @param type A GLenum specifying the data type of the pixel data.
     * @param pixels An object to read data into.
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels
     */
    readPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, format: ReadPixelsFormat, type: ReadPixelsType, pixels: ArrayBufferView): void
    {
        const { gl } = this._webGLRenderer;
        gl.readPixels(x, y, width, height, gl[format], gl[type], pixels);
    }

    /**
     * The WebGLRenderingContext.texImage2D() method of the WebGL API specifies a two-dimensional texture image.
     *
     * @param target A GLenum specifying the binding point (target) of the active texture.
     * @param level A GLint specifying the level of detail. Level 0 is the base image level and level n is the n-th mipmap reduction level.
     * @param internalformat A GLenum specifying the color components in the texture.
     * @param format A GLenum specifying the format of the texel data. In WebGL 1, this must be the same as internalformat (see above).
     * @param type A GLenum specifying the data type of the texel data.
     * @param source One of the following objects can be used as a pixel source for the texture.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    texImage2D(target: TexImage2DTarget, level: number, internalformat: TextureFormat, format: TextureFormat, type: TextureDataType, source: TexImageSource): void;
    /**
     * The WebGLRenderingContext.texImage2D() method of the WebGL API specifies a two-dimensional texture image.
     *
     * @param target A GLenum specifying the binding point (target) of the active texture.
     * @param level A GLint specifying the level of detail. Level 0 is the base image level and level n is the n-th mipmap reduction level.
     * @param internalformat A GLenum specifying the color components in the texture.
     * @param width A GLsizei specifying the width of the texture.
     * @param height A GLsizei specifying the height of the texture.
     * @param border A GLint specifying the width of the border. Must be 0.
     * @param format A GLenum specifying the format of the texel data. In WebGL 1, this must be the same as internalformat (see above).
     * @param type A GLenum specifying the data type of the texel data.
     * @param pixels One of the following objects can be used as a pixel source for the texture.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    texImage2D(target: TexImage2DTarget, level: GLint, internalformat: TextureFormat, width: GLsizei, height: GLsizei, border: GLint, format: TextureFormat, type: TextureDataType, pixels: ArrayBufferView | null): void;
    texImage2D(...args: any[]): void
    {
        const { gl } = this._webGLRenderer;
        if (args.length === 6)
        {
            const target: TexImage2DTarget = args[0];
            const level: number = args[1];
            const internalformat: TextureFormat = args[2];
            const format: TextureFormat = args[3];
            const type: TextureDataType = args[4];
            const source: TexImageSource = args[5];

            gl.texImage2D(gl[target], level, gl[internalformat], gl[format], gl[type], source);
        }
        else
        {
            const target: TexImage2DTarget = args[0];
            const level: GLint = args[1];
            const internalformat: TextureFormat = args[2];
            const width: GLsizei = args[3];
            const height: GLsizei = args[4];
            const border: GLint = args[5];
            const format: TextureFormat = args[6];
            const type: TextureDataType = args[7];
            const pixels: ArrayBufferView | null = args[8];

            gl.texImage2D(gl[target], level, gl[internalformat], width, height, border, gl[format], gl[type], pixels);
        }
    }
    // texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, pixels: ArrayBufferView | null): void;
    // texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, format: GLenum, type: GLenum, source: TexImageSource): void;

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param v A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform1fv(location: WebGLUniformLocation | null, v: Float32List): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform1fv(location, v);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param v A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform1iv(location: WebGLUniformLocation | null, v: Int32List): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform1iv(location, v);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param v A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform2fv(location: WebGLUniformLocation | null, v: Float32List): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform2fv(location, v);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param v A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform2iv(location: WebGLUniformLocation | null, v: Int32List): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform2iv(location, v);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param v A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform3fv(location: WebGLUniformLocation | null, v: Float32List): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform3fv(location, v);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param v A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform3iv(location: WebGLUniformLocation | null, v: Int32List): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform3iv(location, v);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param v A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform4fv(location: WebGLUniformLocation | null, v: Float32List): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform4fv(location, v);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param v A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform4iv(location: WebGLUniformLocation | null, v: Int32List): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform4iv(location, v);
    }

    /**
     * The WebGLRenderingContext.uniformMatrix[234]fv() methods of the WebGL API specify matrix values for uniform variables.
     *
     * The three versions of this method (uniformMatrix2fv(), uniformMatrix3fv(), and uniformMatrix4fv()) take as the input value 2-component, 3-component, and 4-component square matrices, respectively. They are expected to have 4, 9 or 16 floats.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify. The location is obtained using getUniformLocation().
     * @param transpose A GLboolean specifying whether to transpose the matrix. Must be false.
     * @param value A Float32Array or sequence of GLfloat values. The values are assumed to be supplied in column major order.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniformMatrix
     */
    uniformMatrix2fv(location: WebGLUniformLocation | null, transpose: GLboolean, value: Float32List): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniformMatrix2fv(location, transpose, value);
    }

    /**
     * The WebGLRenderingContext.uniformMatrix[234]fv() methods of the WebGL API specify matrix values for uniform variables.
     *
     * The three versions of this method (uniformMatrix2fv(), uniformMatrix3fv(), and uniformMatrix4fv()) take as the input value 2-component, 3-component, and 4-component square matrices, respectively. They are expected to have 4, 9 or 16 floats.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify. The location is obtained using getUniformLocation().
     * @param transpose A GLboolean specifying whether to transpose the matrix. Must be false.
     * @param value A Float32Array or sequence of GLfloat values. The values are assumed to be supplied in column major order.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniformMatrix
     */
    uniformMatrix3fv(location: WebGLUniformLocation | null, transpose: GLboolean, value: Float32List): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniformMatrix3fv(location, transpose, value);
    }

    /**
     * The WebGLRenderingContext.uniformMatrix[234]fv() methods of the WebGL API specify matrix values for uniform variables.
     *
     * The three versions of this method (uniformMatrix2fv(), uniformMatrix3fv(), and uniformMatrix4fv()) take as the input value 2-component, 3-component, and 4-component square matrices, respectively. They are expected to have 4, 9 or 16 floats.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify. The location is obtained using getUniformLocation().
     * @param transpose A GLboolean specifying whether to transpose the matrix. Must be false.
     * @param value A Float32Array or sequence of GLfloat values. The values are assumed to be supplied in column major order.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniformMatrix
     */
    uniformMatrix4fv(location: WebGLUniformLocation | null, transpose: GLboolean, value: Float32List): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniformMatrix4fv(location, transpose, value);
    }
}
