import { imageDatas } from '../textures/Texture2D';
import { AttachmentPoint, ClearMask, EnableCap, FramebufferTarget, Renderbuffertarget, TexImage2DTarget, TextureDataType, TextureFormat, TextureTarget } from './gl/WebGLEnums';
import { WebGLRenderer } from './WebGLRenderer';

/**
 * WebGL上下文。
 *
 * 包装 WebGLRenderingContext
 */
export class WebGLContext
{
    private _webGLRenderer: WebGLRenderer;

    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;
    }

    /**
     * The WebGLRenderingContext.bindTexture() method of the WebGL API binds a given WebGLTexture to a target (binding point).
     *
     * @param target A GLenum specifying the binding point (target).
     * @param texture A WebGLTexture object to bind.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
     */
    bindTexture(target: TextureTarget, texture: WebGLTexture | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.bindTexture(gl[target], texture);
    }

    /**
     * The WebGLRenderingContext.bindFramebuffer() method of the WebGL API binds to the specified target the provided WebGLFramebuffer, or, if the framebuffer argument is null, the default WebGLFramebuffer, which is associated with the canvas rendering context.
     *
     * @param target A GLenum specifying the binding point (target).
     * @param framebuffer A WebGLFramebuffer object to bind, or null for binding the Canvas or OffscreenCanvas object associated with the rendering context.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer
     */
    bindFramebuffer(target: FramebufferTarget, framebuffer: WebGLFramebuffer | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.bindFramebuffer(gl[target], framebuffer);
    }

    /**
     * The WebGLRenderingContext.bindRenderbuffer() method of the WebGL API binds a given WebGLRenderbuffer to a target, which must be gl.RENDERBUFFER.
     *
     * @param target A GLenum specifying the binding point (target).
     * @param renderbuffer A WebGLRenderbuffer object to bind.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindRenderbuffer
     */
    bindRenderbuffer(target: Renderbuffertarget, renderbuffer: WebGLRenderbuffer | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.bindRenderbuffer(gl[target], renderbuffer);
    }

    /**
     * The WebGLRenderingContext.checkFramebufferStatus() method of the WebGL API returns the completeness status of the WebGLFramebuffer object.
     *
     * @param target A GLenum specifying the binding point (target).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/checkFramebufferStatus
     */
    checkFramebufferStatus(target: FramebufferTarget): GLenum
    {
        const { gl } = this._webGLRenderer;
        const status = gl.checkFramebufferStatus(gl[target]);

        return status;
    }

    /**
     * The WebGLRenderingContext.clear() method of the WebGL API clears buffers to preset values.
     *
     * The preset values can be set by clearColor(), clearDepth() or clearStencil().
     *
     * The scissor box, dithering, and buffer writemasks can affect the clear() method.
     *
     * @param mask A GLbitfield bitwise OR mask that indicates the buffers to be cleared.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
     */
    clear(mask: ClearMask[]): void
    {
        const { gl } = this._webGLRenderer;
        const value = mask.reduce((pv, cv) =>
        {
            pv |= gl[cv];

            return pv;
        }, 0);

        gl.clear(value);
    }

    /**
     * The WebGLRenderingContext.clearColor() method of the WebGL API specifies the color values used when clearing color buffers.
     *
     * This specifies what color values to use when calling the clear() method. The values are clamped between 0 and 1.
     *
     * @param red A GLclampf specifying the red color value used when the color buffers are cleared. Default value: 0.
     * @param green A GLclampf specifying the green color value used when the color buffers are cleared. Default value: 0.
     * @param blue A GLclampf specifying the blue color value used when the color buffers are cleared. Default value: 0.
     * @param alpha A GLclampf specifying the alpha (transparency) value used when the color buffers are cleared. Default value: 0.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearColor
     */
    clearColor(red: GLclampf = 0, green: GLclampf = 0, blue: GLclampf = 0, alpha: GLclampf = 0): void
    {
        const { gl } = this._webGLRenderer;
        gl.clearColor(red, green, blue, alpha);
    }

    /**
     * The WebGLRenderingContext.clearDepth() method of the WebGL API specifies the clear value for the depth buffer.
     *
     * This specifies what depth value to use when calling the clear() method. The value is clamped between 0 and 1.
     *
     * @param depth A GLclampf specifying the depth value used when the depth buffer is cleared. Default value: 1.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth
     */
    clearDepth(depth: GLclampf): void
    {
        const { gl } = this._webGLRenderer;
        gl.clearDepth(depth);
    }

    /**
     * The WebGLRenderingContext.clearStencil() method of the WebGL API specifies the clear value for the stencil buffer.
     *
     * This specifies what stencil value to use when calling the clear() method.
     *
     * @param s A GLint specifying the index used when the stencil buffer is cleared. Default value: 0.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearStencil
     */
    clearStencil(s: GLint = 0): void
    {
        const { gl } = this._webGLRenderer;
        gl.clearStencil(s);
    }

    /**
     * The WebGLRenderingContext.colorMask() method of the WebGL API sets which color components to enable or to disable when drawing or rendering to a WebGLFramebuffer.
     *
     * @param red A GLboolean specifying whether or not the red color component can be written into the frame buffer. Default value: true.
     * @param green A GLboolean specifying whether or not the green color component can be written into the frame buffer. Default value: true.
     * @param blue A GLboolean specifying whether or not the blue color component can be written into the frame buffer. Default value: true.
     * @param alpha A GLboolean specifying whether or not the alpha (transparency) component can be written into the frame buffer. Default value: true.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask
     */
    colorMask(red: GLboolean, green: GLboolean, blue: GLboolean, alpha: GLboolean): void
    {
        const { gl } = this._webGLRenderer;
        gl.colorMask(red, green, blue, alpha);
    }

    /**
     * The WebGLRenderingContext.enable() method of the WebGL API enables specific WebGL capabilities for this context.
     *
     * @param cap A GLenum specifying which WebGL capability to enable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enable
     */
    enable(cap: EnableCap): void
    {
        const { gl } = this._webGLRenderer;
        gl.enable(gl[cap]);
    }

    /**
     * The WebGLRenderingContext.framebufferTexture2D() method of the WebGL API attaches a texture to a WebGLFramebuffer.
     *
     * @param target A GLenum specifying the binding point (target).
     * @param attachment A GLenum specifying the attachment point for the texture.
     * @param textarget A GLenum specifying the texture target.
     * @param texture A WebGLTexture object whose image to attach.
     * @param level A GLint specifying the mipmap level of the texture image to be attached. Must be 0.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferTexture2D
     */
    framebufferTexture2D(target: FramebufferTarget, attachment: AttachmentPoint, textarget: TexImage2DTarget, texture: WebGLTexture | null, level: GLint = 0): void
    {
        const { gl } = this._webGLRenderer;
        gl.framebufferTexture2D(gl[target], gl[attachment], gl[textarget], texture, level);
    }

    /**
     * The WebGLRenderingContext.framebufferRenderbuffer() method of the WebGL API attaches a WebGLRenderbuffer object to a WebGLFramebuffer object.
     *
     * @param target A GLenum specifying the binding point (target) for the framebuffer.
     * @param AttachmentPoint A GLenum specifying the attachment point for the render buffer.
     * @param renderbuffertarget A GLenum specifying the binding point (target) for the render buffer.
     * @param renderbuffer A WebGLRenderbuffer object to attach.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferRenderbuffer
     */
    framebufferRenderbuffer(target: FramebufferTarget, attachment: AttachmentPoint, renderbuffertarget: Renderbuffertarget, renderbuffer: WebGLRenderbuffer | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.framebufferRenderbuffer(gl[target], gl[attachment], gl[renderbuffertarget], renderbuffer);
    }

    /**
     * The WebGLRenderingContext.scissor() method of the WebGL API sets a scissor box, which limits the drawing to a specified rectangle.
     *
     * @param x A GLint specifying the horizontal coordinate for the lower left corner of the box. Default value: 0.
     * @param y A GLint specifying the vertical coordinate for the lower left corner of the box. Default value: 0.
     * @param width A non-negative GLsizei specifying the width of the scissor box. Default value: width of the canvas.
     * @param height A non-negative GLsizei specifying the height of the scissor box. Default value: height of the canvas.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
     */
    scissor(x: GLint, y: GLint, width: GLsizei, height: GLsizei): void
    {
        const { gl } = this._webGLRenderer;
        gl.scissor(x, y, width, height);
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

    /**
     * The WebGLRenderingContext.viewport() method of the WebGL API sets the viewport, which specifies the affine transformation of x and y from normalized device coordinates to window coordinates.
     *
     * @param x A GLint specifying the horizontal coordinate for the lower left corner of the viewport origin. Default value: 0.
     * @param y A GLint specifying the vertical coordinate for the lower left corner of the viewport origin. Default value: 0.
     * @param width A non-negative GLsizei specifying the width of the viewport. Default value: width of the canvas.
     * @param height A non-negative GLsizei specifying the height of the viewport. Default value: height of the canvas.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
     */
    viewport(x: GLint, y: GLint, width: GLsizei, height: GLsizei): void
    {
        const { gl } = this._webGLRenderer;
        gl.viewport(x, y, width, height);
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
