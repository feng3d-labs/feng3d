import { imageDatas } from '../textures/Texture2D';
import { ReadPixelsFormat, ReadPixelsType, TexImage2DTarget, TextureDataType, TextureFormat } from './gl/WebGLEnums';
import { WebGLContextBase } from './WebGLContextBase';

/**
 * 对应 lib.dom.d.ts 中 WebGLRenderingContextOverloads 接口。
 */
export class WebGLContextOverloads extends WebGLContextBase
{
    // bufferData(target: GLenum, size: GLsizeiptr, usage: GLenum): void;
    // bufferData(target: GLenum, data: BufferSource | null, usage: GLenum): void;
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
        if (args.length === 6)
        {
            this._texImage2DTexImageSource.apply(this, args);
        }
        else
        {
            this._texImage2DPixels.apply(this, args);
        }
    }
    // texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, pixels: ArrayBufferView | null): void;
    // texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, format: GLenum, type: GLenum, source: TexImageSource): void;
    // uniform1fv(location: WebGLUniformLocation | null, v: Float32List): void;
    // uniform1iv(location: WebGLUniformLocation | null, v: Int32List): void;
    // uniform2fv(location: WebGLUniformLocation | null, v: Float32List): void;
    // uniform2iv(location: WebGLUniformLocation | null, v: Int32List): void;
    // uniform3fv(location: WebGLUniformLocation | null, v: Float32List): void;
    // uniform3iv(location: WebGLUniformLocation | null, v: Int32List): void;
    // uniform4fv(location: WebGLUniformLocation | null, v: Float32List): void;
    // uniform4iv(location: WebGLUniformLocation | null, v: Int32List): void;
    // uniformMatrix2fv(location: WebGLUniformLocation | null, transpose: GLboolean, value: Float32List): void;
    // uniformMatrix3fv(location: WebGLUniformLocation | null, transpose: GLboolean, value: Float32List): void;
    // uniformMatrix4fv(location: WebGLUniformLocation | null, transpose: GLboolean, value: Float32List): void;

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
    private _texImage2DTexImageSource(target: TexImage2DTarget, level: number, internalformat: TextureFormat, format: TextureFormat, type: TextureDataType, source: TexImageSource): void
    {
        const { gl } = this._webGLRenderer;
        if (!source)
        {
            source = imageDatas.white;
        }

        gl.texImage2D(gl[target], level, gl[internalformat], gl[format], gl[type], source);
    }

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
    private _texImage2DPixels(target: TexImage2DTarget, level: GLint, internalformat: TextureFormat, width: GLsizei, height: GLsizei, border: GLint, format: TextureFormat, type: TextureDataType, pixels: ArrayBufferView | null)
    {
        const { gl } = this._webGLRenderer;
        gl.texImage2D(gl[target], level, gl[internalformat], width, height, border, gl[format], gl[type], pixels);
    }
}
