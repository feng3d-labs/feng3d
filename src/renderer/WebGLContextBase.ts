import { VertexAttributeTypes } from './data/AttributeBuffer';
import { AttachmentPoint, BufferTarget, Capability, ClearMask, FramebufferTarget, PrecisionType, Renderbuffertarget, ShaderType, TexImage2DTarget, TextureTarget } from './gl/WebGLEnums';
import { WebGLParameters } from './gl/WebGLParameters';
import { WebGLRenderer } from './WebGLRenderer';

/**
 * 对应 lib.dom.d.ts 中 WebGLRenderingContextBase 接口。
 */
export class WebGLContextBase
{
    /**
     * FrameBuffer 状态完整。
     */
    get FRAMEBUFFER_COMPLETE(): GLenum
    {
        return this._webGLRenderer.gl.FRAMEBUFFER_COMPLETE;
    }

    protected _webGLRenderer: WebGLRenderer;

    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;
    }

    /**
     * The WebGLRenderingContext.bindBuffer() method of the WebGL API binds a given WebGLBuffer to a target.
     *
     * @param target A GLenum specifying the binding point (target).
     * @param buffer A WebGLBuffer to bind.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer
     */
    bindBuffer(target: BufferTarget, buffer: WebGLBuffer | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.bindBuffer(gl[target], buffer);
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
     * The WebGLRenderingContext.createBuffer() method of the WebGL API creates and initializes a WebGLBuffer storing data such as vertices or colors.
     *
     * @returns A WebGLBuffer storing data such as vertices or colors.
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createBuffer
     */
    createBuffer(): WebGLBuffer | null
    {
        const { gl } = this._webGLRenderer;
        const buffer = gl.createBuffer();

        return buffer;
    }

    /**
     * The WebGLRenderingContext.deleteBuffer() method of the WebGL API deletes a given WebGLBuffer. This method has no effect if the buffer has already been deleted. Normally you don't need to call this method yourself, when the buffer object is dereferenced it will be marked as free.
     *
     * @param buffer A WebGLBuffer object to delete.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteBuffer
     */
    deleteBuffer(buffer: WebGLBuffer | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.deleteBuffer(buffer);
    }

    /**
     * The WebGLRenderingContext.disable() method of the WebGL API disables specific WebGL capabilities for this context.
     *
     * @param cap A GLenum specifying which WebGL capability to disable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disable
     */
    disable(cap: Capability): void
    {
        const { gl } = this._webGLRenderer;
        gl.disable(gl[cap]);
    }

    /**
     * The WebGLRenderingContext.enable() method of the WebGL API enables specific WebGL capabilities for this context.
     *
     * @param cap A GLenum specifying which WebGL capability to enable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enable
     */
    enable(cap: Capability): void
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
     * The WebGLRenderingContext.getParameter() method of the WebGL API returns a value for the passed parameter name.
     *
     * @param pname A GLenum specifying which parameter value to return.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
     */
    getParameter<K extends keyof WebGLParameters>(pname: K): WebGLParameters[K]
    {
        const { gl, extensions } = this._webGLRenderer;

        let pnameV: number = gl[pname as any];

        switch (pname)
        {
            case 'MAX_TEXTURE_MAX_ANISOTROPY_EXT':
                const ext = extensions.get('EXT_texture_filter_anisotropic');
                if (!ext)
                {
                    return 0 as any;
                }
                pnameV = ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT;
                break;
        }
        const result = gl.getParameter(pnameV);

        return result;
    }

    /**
     * The WebGLRenderingContext.getShaderPrecisionFormat() method of the WebGL API returns a new WebGLShaderPrecisionFormat object describing the range and precision for the specified shader numeric format.
     *
     * @param shadertype Either a gl.FRAGMENT_SHADER or a gl.VERTEX_SHADER.
     * @param precisiontype A precision type value. Either gl.LOW_FLOAT, gl.MEDIUM_FLOAT, gl.HIGH_FLOAT, gl.LOW_INT, gl.MEDIUM_INT, or gl.HIGH_INT.
     * @returns A WebGLShaderPrecisionFormat object or null, if an error occurs.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderPrecisionFormat
     */
    getShaderPrecisionFormat(shadertype: ShaderType, precisiontype: PrecisionType): WebGLShaderPrecisionFormat | null
    {
        const { gl } = this._webGLRenderer;
        const result = gl.getShaderPrecisionFormat(gl[shadertype], gl[precisiontype]);

        return result;
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
     * The WebGLRenderingContext.vertexAttribPointer() method of the WebGL API binds the buffer currently bound to gl.ARRAY_BUFFER to a generic vertex attribute of the current vertex buffer object and specifies its layout.
     *
     * @param index A GLuint specifying the index of the vertex attribute that is to be modified.
     * @param size A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
     * @param type A GLenum specifying the data type of each component in the array.
     * @param normalized A GLboolean specifying whether integer data values should be normalized into a certain range when being cast to a float.
     * * For types gl.BYTE and gl.SHORT, normalizes the values to [-1, 1] if true.
     * * For types gl.UNSIGNED_BYTE and gl.UNSIGNED_SHORT, normalizes the values to [0, 1] if true.
     * * For types gl.FLOAT and gl.HALF_FLOAT, this parameter has no effect.
     * @param stride A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. Cannot be larger than 255. If stride is 0, the attribute is assumed to be tightly packed, that is, the attributes are not interleaved but each attribute is in a separate block, and the next vertex' attribute follows immediately after the current vertex.
     * @param offset A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of the byte length of type.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     */
    vertexAttribPointer(index: GLuint, size: 1 | 2 | 3 | 4, type: VertexAttributeTypes, normalized: GLboolean, stride: GLsizei, offset: GLintptr): void
    {
        const { gl } = this._webGLRenderer;
        gl.vertexAttribPointer(index, size, gl[type], normalized, stride, offset);
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
}
