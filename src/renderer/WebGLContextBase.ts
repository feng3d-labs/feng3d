import { VertexAttributeTypes } from './data/AttributeBuffer';
import { DrawElementType } from './data/ElementBuffer';
import { BlendEquation, BlendFactor, CullFace, DepthFunc, DrawMode, FrontFace, StencilFunc, StencilOp } from './data/RenderParams';
import { AttachmentPoint, BufferTarget, Capability, ClearMask, FramebufferTarget, PixelStoreiParameter, PrecisionType, ProgramParameter, RenderbufferInternalformat, Renderbuffertarget, ShaderParameter, ShaderType, TexImage2DTarget, TexParameterf, TexParameteri, TextureTarget } from './gl/WebGLEnums';
import { WebGLExtensionMapFull } from './gl/WebGLExtensions';
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
     * The WebGLRenderingContext.activeTexture() method of the WebGL API specifies which texture unit to make active.
     *
     * @param texture The texture unit to make active. The value is a gl.TEXTUREI where I is within the range from 0 to gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS - 1.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/activeTexture
     */
    activeTexture(textureID: GLenum): void
    {
        const { gl } = this._webGLRenderer;
        gl.activeTexture(gl[`TEXTURE${textureID}`]);
    }

    /**
     * The WebGLRenderingContext.attachShader() method of the WebGL API attaches either a fragment or vertex WebGLShader to a WebGLProgram.
     *
     * @param program A WebGLProgram.
     * @param shader A fragment or vertex WebGLShader.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/attachShader
     */
    attachShader(program: WebGLProgram, shader: WebGLShader): void
    {
        const { gl } = this._webGLRenderer;
        gl.attachShader(program, shader);
    }

    // bindAttribLocation(program: WebGLProgram, index: GLuint, name: string): void;

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

    // blendColor(red: GLclampf, green: GLclampf, blue: GLclampf, alpha: GLclampf): void;

    /**
     * The WebGLRenderingContext.blendEquation() method of the WebGL API is used to set both the RGB blend equation and alpha blend equation to a single equation.
     *
     * The blend equation determines how a new pixel is combined with a pixel already in the WebGLFramebuffer.
     *
     * @param mode A GLenum specifying how source and destination colors are combined.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
     */
    blendEquation(mode: BlendEquation): void
    {
        const { gl } = this._webGLRenderer;
        gl.blendEquation(gl[mode]);
    }

    // blendEquationSeparate(modeRGB: GLenum, modeAlpha: GLenum): void;

    /**
     * The WebGLRenderingContext.blendFunc() method of the WebGL API defines which function is used for blending pixel arithmetic.
     *
     * @param sfactor A WebGL_API.Types specifying a multiplier for the source blending factors. The default value is gl.ONE. For possible values, see below.
     * @param dfactor A WebGL_API.Types specifying a multiplier for the destination blending factors. The default value is gl.ZERO. For possible values, see below.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
     */
    blendFunc(sfactor: BlendFactor, dfactor: BlendFactor): void
    {
        const { gl } = this._webGLRenderer;
        gl.blendFunc(gl[sfactor], gl[dfactor]);
    }

    // blendFuncSeparate(srcRGB: GLenum, dstRGB: GLenum, srcAlpha: GLenum, dstAlpha: GLenum): void;

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
     * The WebGLRenderingContext.compileShader() method of the WebGL API compiles a GLSL shader into binary data so that it can be used by a WebGLProgram.
     *
     * @param shader A fragment or vertex WebGLShader.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compileShader
     */
    compileShader(shader: WebGLShader): void
    {
        const { gl } = this._webGLRenderer;
        gl.compileShader(shader);
    }

    // copyTexImage2D(target: GLenum, level: GLint, internalformat: GLenum, x: GLint, y: GLint, width: GLsizei, height: GLsizei, border: GLint): void;
    // copyTexSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, x: GLint, y: GLint, width: GLsizei, height: GLsizei): void;

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
     * The WebGLRenderingContext.createFramebuffer() method of the WebGL API creates and initializes a WebGLFramebuffer object.
     *
     * @returns A WebGLFramebuffer object.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createFramebuffer
     */
    createFramebuffer(): WebGLFramebuffer | null
    {
        const { gl } = this._webGLRenderer;
        const framebuffer = gl.createFramebuffer();

        return framebuffer;
    }

    /**
     * The WebGLRenderingContext.createProgram() method of the WebGL API creates and initializes a WebGLProgram object.
     *
     * @returns A WebGLProgram object that is a combination of two compiled WebGLShaders consisting of a vertex shader and a fragment shader (both written in GLSL). These are then linked into a usable program.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram
     */
    createProgram(): WebGLProgram | null
    {
        const { gl } = this._webGLRenderer;
        const program = gl.createProgram();
        if (!program)
        {
            throw '创建 WebGLProgram 失败！';
        }

        return program;
    }

    /**
     * The WebGLRenderingContext.createRenderbuffer() method of the WebGL API creates and initializes a WebGLRenderbuffer object.
     *
     * @returns A WebGLRenderbuffer object that stores data such an image, or can be source or target of an rendering operation.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createRenderbuffer
     */
    createRenderbuffer(): WebGLRenderbuffer | null
    {
        const { gl } = this._webGLRenderer;
        const buffer = gl.createRenderbuffer();

        return buffer;
    }

    /**
     * The WebGLRenderingContext method createShader() of the WebGL API creates a WebGLShader that can then be configured further using WebGLRenderingContext.shaderSource() and WebGLRenderingContext.compileShader().
     *
     * @param type Either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @returns A new (WebGLShader).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createShader
     */
    createShader(type: ShaderType): WebGLShader | null
    {
        const { gl } = this._webGLRenderer;
        const shader = gl.createShader(gl[type]);
        if (!shader)
        {
            throw 'unable to create shader';
        }

        return shader;
    }

    /**
     * The WebGLRenderingContext.createTexture() method of the WebGL API creates and initializes a WebGLTexture object.
     *
     * @returns A WebGLTexture object to which images can be bound to.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createTexture
     */
    createTexture(): WebGLTexture | null
    {
        const { gl } = this._webGLRenderer;
        const texture = gl.createTexture();
        if (!texture)
        {
            throw 'createTexture 失败！';
        }

        return texture;
    }

    /**
     * The WebGLRenderingContext.cullFace() method of the WebGL API specifies whether or not front- and/or back-facing polygons can be culled.
     *
     * @param mode A GLenum specifying whether front- or back-facing polygons are candidates for culling.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
     */
    cullFace(mode: CullFace): void
    {
        const { gl } = this._webGLRenderer;
        gl.cullFace(gl[mode]);
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
     * The WebGLRenderingContext.deleteFramebuffer() method of the WebGL API deletes a given WebGLFramebuffer object. This method has no effect if the frame buffer has already been deleted.
     *
     * @param framebuffer A WebGLFramebuffer object to delete.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteFramebuffer
     */
    deleteFramebuffer(framebuffer: WebGLFramebuffer | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.deleteFramebuffer(framebuffer);
    }

    /**
     * The WebGLRenderingContext.deleteProgram() method of the WebGL API deletes a given WebGLProgram object. This method has no effect if the program has already been deleted.
     *
     * @param program A WebGLProgram object to delete.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteProgram
     */
    deleteProgram(program: WebGLProgram | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.deleteProgram(program);
    }

    /**
     * The WebGLRenderingContext.deleteRenderbuffer() method of the WebGL API deletes a given WebGLRenderbuffer object. This method has no effect if the render buffer has already been deleted.
     *
     * @param renderbuffer deleteRenderbuffer(renderbuffer)
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteRenderbuffer
     */
    deleteRenderbuffer(renderbuffer: WebGLRenderbuffer | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.deleteRenderbuffer(renderbuffer);
    }

    /**
     * The WebGLRenderingContext.deleteShader() method of the WebGL API marks a given WebGLShader object for deletion. It will then be deleted whenever the shader is no longer in use. This method has no effect if the shader has already been deleted, and the WebGLShader is automatically marked for deletion when it is destroyed by the garbage collector.
     *
     * @param shader A WebGLShader object to delete.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteShader
     */
    deleteShader(shader: WebGLShader | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.deleteShader(shader);
    }

    /**
     * The WebGLRenderingContext.deleteTexture() method of the WebGL API deletes a given WebGLTexture object. This method has no effect if the texture has already been deleted.
     *
     * @param texture A WebGLTexture object to delete.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteTexture
     */
    deleteTexture(texture: WebGLTexture | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.deleteTexture(texture);
    }

    /**
     * The WebGLRenderingContext.depthFunc() method of the WebGL API specifies a function that compares incoming pixel depth to the current depth buffer value.
     *
     * @param func A GLenum specifying the depth comparison function, which sets the conditions under which the pixel will be drawn. The default value is gl.LESS.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
     */
    depthFunc(func: DepthFunc): void
    {
        const { gl } = this._webGLRenderer;
        gl.depthFunc(gl[func]);
    }

    /**
     * The WebGLRenderingContext.depthMask() method of the WebGL API sets whether writing into the depth buffer is enabled or disabled.
     *
     * @param flag A GLboolean specifying whether or not writing into the depth buffer is enabled. Default value: true, meaning that writing is enabled.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthMask
     */
    depthMask(flag: GLboolean): void
    {
        const { gl } = this._webGLRenderer;
        gl.depthMask(flag);
    }

    // depthRange(zNear: GLclampf, zFar: GLclampf): void;
    // detachShader(program: WebGLProgram, shader: WebGLShader): void;

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
     * The WebGLRenderingContext.disableVertexAttribArray() method of the WebGL API turns the generic vertex attribute array off at a given index position.
     *
     * @param index A GLuint specifying the index of the vertex attribute to disable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disableVertexAttribArray
     */
    disableVertexAttribArray(index: GLuint): void
    {
        const { gl } = this._webGLRenderer;
        gl.disableVertexAttribArray(index);
    }

    /**
     * The WebGLRenderingContext.drawArrays() method of the WebGL API renders primitives from array data.
     *
     * @param mode A GLenum specifying the type primitive to render.
     * @param first A GLint specifying the starting index in the array of vector points.
     * @param count A GLsizei specifying the number of indices to be rendered.
     */
    drawArrays(mode: DrawMode, first: GLint, count: GLsizei): void
    {
        const { gl } = this._webGLRenderer;
        gl.drawArrays(gl[mode], first, count);
    }

    /**
     * The WebGLRenderingContext.drawElements() method of the WebGL API renders primitives from array data.
     *
     * @param mode A GLenum specifying the type primitive to render.
     * @param count A GLsizei specifying the number of elements of the bound element array buffer to be rendered. For example, to draw a wireframe triangle with gl.LINES the count should be 2 endpoints per line × 3 lines = 6 elements. However to draw the same wireframe triangle with gl.LINE_STRIP the element array buffer does not repeat the indices for the end of the first line/start of the second line, and end of the second line/start of the third line, so count will be four. To draw the same triangle with gl.LINE_LOOP the element array buffer does not repeat the first/last vertex either so count will be three.
     * @param type A GLenum specifying the type of the values in the element array buffer.
     * @param offset A GLintptr specifying a byte offset in the element array buffer. Must be a valid multiple of the size of the given type.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
     */
    drawElements(mode: DrawMode, count: GLsizei, type: DrawElementType, offset: GLintptr): void
    {
        const { gl } = this._webGLRenderer;
        gl.drawElements(gl[mode], count, gl[type], offset);
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
     * The WebGLRenderingContext method enableVertexAttribArray(), part of the WebGL API, turns on the generic vertex attribute array at the specified index into the list of attribute arrays.
     *
     * @param index A GLuint specifying the index number that uniquely identifies the vertex attribute to enable. If you know the name of the attribute but not its index, you can get the index by calling getAttribLocation().
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray
     */
    enableVertexAttribArray(index: GLuint): void
    {
        const { gl } = this._webGLRenderer;
        gl.enableVertexAttribArray(index);
    }

    // finish(): void;
    // flush(): void;

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
     * The WebGLRenderingContext.frontFace() method of the WebGL API specifies whether polygons are front- or back-facing by setting a winding orientation.
     *
     * @param mode A GLenum type winding orientation. The default value is gl.CCW.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
     */
    frontFace(mode: FrontFace): void
    {
        const { gl } = this._webGLRenderer;
        gl.frontFace(gl[mode]);
    }

    /**
     * The WebGLRenderingContext.generateMipmap() method of the WebGL API generates a set of mipmaps for a WebGLTexture object.
     *
     * Mipmaps are used to create distance with objects. A higher-resolution mipmap is used for objects that are closer, and a lower-resolution mipmap is used for objects that are farther away. It starts with the resolution of the texture image and halves the resolution until a 1x1 dimension texture image is created.
     *
     * @param target A GLenum specifying the binding point (target) of the active texture whose mipmaps will be generated.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/generateMipmap
     */
    generateMipmap(target: TextureTarget): void
    {
        const { gl } = this._webGLRenderer;
        gl.generateMipmap(gl[target]);
    }

    /**
     * The WebGLRenderingContext.getActiveAttrib() method of the WebGL API returns a WebGLActiveInfo object containing size, type, and name of a vertex attribute. It is generally used when querying unknown attributes either for debugging or generic library creation.
     *
     * @param program A WebGLProgram containing the vertex attribute.
     * @param index A GLuint specifying the index of the vertex attribute to get. This value is an index 0 to N - 1 as returned by gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES).
     * @returns A WebGLActiveInfo object.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveAttrib
     */
    getActiveAttrib(program: WebGLProgram, index: GLuint): WebGLActiveInfo | null
    {
        const { gl } = this._webGLRenderer;
        const activeInfo = gl.getActiveAttrib(program, index);

        return activeInfo;
    }

    /**
     * The WebGLRenderingContext.getActiveUniform() method of the WebGL API returns a WebGLActiveInfo object containing size, type, and name of a uniform attribute. It is generally used when querying unknown uniforms either for debugging or generic library creation.
     *
     * @param program A WebGLProgram specifying the WebGL shader program from which to obtain the uniform variable's information.
     * @param index A GLuint specifying the index of the uniform attribute to get. This value is an index 0 to N - 1 as returned by gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS).
     * @returns A WebGLActiveInfo object describing the uniform.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
     */
    getActiveUniform(program: WebGLProgram, index: GLuint): WebGLActiveInfo | null
    {
        const { gl } = this._webGLRenderer;
        const activeInfo = gl.getActiveUniform(program, index);

        return activeInfo;
    }

    // getAttachedShaders(program: WebGLProgram): WebGLShader[] | null;

    /**
     * The WebGLRenderingContext.getAttribLocation() method of the WebGL API returns the location of an attribute variable in a given WebGLProgram.
     *
     * @param program A WebGLProgram containing the attribute variable.
     * @param name A string specifying the name of the attribute variable whose location to get.
     * @returns A GLint number indicating the location of the variable name if found. Returns -1 otherwise.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getAttribLocation
     */
    getAttribLocation(program: WebGLProgram, name: string): GLint
    {
        const { gl } = this._webGLRenderer;
        const location = gl.getAttribLocation(program, name);

        return location;
    }

    // getBufferParameter(target: GLenum, pname: GLenum): any;
    // getContextAttributes(): WebGLContextAttributes | null;
    // getError(): GLenum;

    /**
     * The WebGLRenderingContext.getExtension() method enables a WebGL extension.
     *
     * @param name A String for the name of the WebGL extension to enable.
     * @returns A WebGL extension object, or null if name does not match (case-insensitive) to one of the strings in WebGLRenderingContext.getSupportedExtensions.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension
     */
    getExtension<K extends keyof WebGLExtensionMapFull>(name: K): WebGLExtensionMapFull[K]
    {
        const { gl } = this._webGLRenderer;
        const ext = gl.getExtension(name);

        return ext;
    }

    // getFramebufferAttachmentParameter(target: GLenum, attachment: GLenum, pname: GLenum): any;

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
                const ext = extensions.getExtension('EXT_texture_filter_anisotropic');
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
     * The WebGLRenderingContext.getProgramInfoLog returns the information log for the specified WebGLProgram object. It contains errors that occurred during failed linking or validation of WebGLProgram objects.
     *
     * @param program The WebGLProgram to query.
     * @returns A string that contains diagnostic messages, warning messages, and other information about the last linking or validation operation. When a WebGLProgram object is initially created, its information log will be a string of length 0.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramInfoLog
     */
    getProgramInfoLog(program: WebGLProgram): string | null
    {
        const { gl } = this._webGLRenderer;
        const infoLog = gl.getProgramInfoLog(program);

        return infoLog;
    }

    /**
     * The WebGLRenderingContext.getProgramParameter() method of the WebGL API returns information about the given program.
     *
     * @param program A WebGLProgram to get parameter information from.
     * @param pname A GLenum specifying the information to query.
     * @returns Returns the requested program information (as specified with pname).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramParameter
     */
    getProgramParameter<K extends keyof ProgramParameter>(program: WebGLProgram, pname: K): ProgramParameter[K]
    {
        const { gl2 } = this._webGLRenderer;
        const result = gl2.getProgramParameter(program, gl2[pname]);

        return result;
    }

    // getRenderbufferParameter(target: GLenum, pname: GLenum): any;

    /**
     * The WebGLRenderingContext.getShaderInfoLog returns the information log for the specified WebGLShader object. It contains warnings, debugging and compile information.
     *
     * @param shader A WebGLShader to query.
     * @returns A string that contains diagnostic messages, warning messages, and other information about the last compile operation. When a WebGLShader object is initially created, its information log will be a string of length 0.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderInfoLog
     */
    getShaderInfoLog(shader: WebGLShader): string | null
    {
        const { gl } = this._webGLRenderer;
        const info = gl.getShaderInfoLog(shader);

        return info;
    }

    /**
     * The WebGLRenderingContext.getShaderParameter() method of the WebGL API returns information about the given shader.
     *
     * @param shader A WebGLShader to get parameter information from.
     * @param pname A GLenum specifying the information to query.
     * @returns Returns the requested shader information (as specified with pname).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderParameter
     */
    getShaderParameter<K extends keyof ShaderParameter>(shader: WebGLShader, pname: K): ShaderParameter[K]
    {
        const { gl } = this._webGLRenderer;
        const result = gl.getShaderParameter(shader, gl[pname]);

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

    // getShaderSource(shader: WebGLShader): string | null;
    // getSupportedExtensions(): string[] | null;
    // getTexParameter(target: GLenum, pname: GLenum): any;
    // getUniform(program: WebGLProgram, location: WebGLUniformLocation): any;

    /**
     * Part of the WebGL API, the WebGLRenderingContext method getUniformLocation() returns the location of a specific uniform variable which is part of a given WebGLProgram.
     *
     * @param program The WebGLProgram in which to locate the specified uniform variable.
     * @param name A string specifying the name of the uniform variable whose location is to be returned. The name can't have any whitespace in it, and you can't use this function to get the location of any uniforms starting with the reserved string "gl_", since those are internal to the WebGL layer.
     * @returns A WebGLUniformLocation value indicating the location of the named variable, if it exists. If the specified variable doesn't exist, null is returned instead.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getUniformLocation
     */
    getUniformLocation(program: WebGLProgram, name: string): WebGLUniformLocation | null
    {
        const { gl } = this._webGLRenderer;
        const location = gl.getUniformLocation(program, name);

        return location;
    }

    // getVertexAttrib(index: GLuint, pname: GLenum): any;
    // getVertexAttribOffset(index: GLuint, pname: GLenum): GLintptr;
    // hint(target: GLenum, mode: GLenum): void;
    // isBuffer(buffer: WebGLBuffer | null): GLboolean;
    // isContextLost(): boolean;
    // isEnabled(cap: GLenum): GLboolean;
    // isFramebuffer(framebuffer: WebGLFramebuffer | null): GLboolean;
    // isProgram(program: WebGLProgram | null): GLboolean;
    // isRenderbuffer(renderbuffer: WebGLRenderbuffer | null): GLboolean;
    // isShader(shader: WebGLShader | null): GLboolean;
    // isTexture(texture: WebGLTexture | null): GLboolean;
    // lineWidth(width: GLfloat): void;

    /**
     * The WebGLRenderingContext interface's linkProgram() method links a given WebGLProgram, completing the process of preparing the GPU code for the program's fragment and vertex shaders.
     *
     * @param program  The WebGLProgram to link.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/linkProgram
     */
    linkProgram(program: WebGLProgram): void
    {
        const { gl } = this._webGLRenderer;
        gl.linkProgram(program);
    }

    /**
     * The WebGLRenderingContext.pixelStorei() method of the WebGL API specifies the pixel storage modes.
     *
     * @param pname A GLenum specifying which parameter to set.
     * @param param A GLint specifying a value to set the pname parameter to.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/pixelStorei
     */
    pixelStorei<K extends keyof PixelStoreiParameter>(pname: K, param: PixelStoreiParameter[K]): void
    {
        const { gl } = this._webGLRenderer;

        let paramV: number | boolean = param as any;
        if (typeof param === 'string')
        {
            paramV = gl[param];
        }

        gl.pixelStorei(gl[pname], paramV);
    }

    /**
     * The WebGLRenderingContext.polygonOffset() method of the WebGL API specifies the scale factors and units to calculate depth values.
     *
     * The offset is added before the depth test is performed and before the value is written into the depth buffer.
     *
     * @param factor A GLfloat which sets the scale factor for the variable depth offset for each polygon. The default value is 0.
     * @param units A GLfloat which sets the multiplier by which an implementation-specific value is multiplied with to create a constant depth offset. The default value is 0.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
     */
    polygonOffset(factor: GLfloat, units: GLfloat): void
    {
        const { gl } = this._webGLRenderer;
        gl.polygonOffset(factor, units);
    }

    /**
     * The WebGLRenderingContext.renderbufferStorage() method of the WebGL API creates and initializes a renderbuffer object's data store.
     *
     * @param target A GLenum specifying the target renderbuffer object. Possible values:
     * @param internalformat A GLenum specifying the internal format of the renderbuffer.
     * @param width A GLsizei specifying the width of the renderbuffer in pixels.
     * @param height A GLsizei specifying the height of the renderbuffer in pixels.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/renderbufferStorage
     */
    renderbufferStorage(target: Renderbuffertarget, internalformat: RenderbufferInternalformat, width: GLsizei, height: GLsizei): void
    {
        const { gl } = this._webGLRenderer;
        gl.renderbufferStorage(gl[target], gl[internalformat], width, height);
    }

    // sampleCoverage(value: GLclampf, invert: GLboolean): void;

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
     * The WebGLRenderingContext.shaderSource() method of the WebGL API sets the source code of a WebGLShader.
     *
     * @param shader A WebGLShader object in which to set the source code.
     * @param source A string containing the GLSL source code to set.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/shaderSource
     */
    shaderSource(shader: WebGLShader, source: string): void
    {
        const { gl } = this._webGLRenderer;
        gl.shaderSource(shader, source);
    }

    /**
     * The WebGLRenderingContext.stencilFunc() method of the WebGL API sets the front and back function and reference value for stencil testing.
     *
     * Stenciling enables and disables drawing on a per-pixel basis. It is typically used in multipass rendering to achieve special effects.
     *
     * @param func A GLenum specifying the test function. The default function is gl.ALWAYS.
     * @param ref A GLint specifying the reference value for the stencil test. This value is clamped to the range 0 to 2^n - 1 where n is the number of bitplanes in the stencil buffer. The default value is 0.
     * @param mask A GLuint specifying a bit-wise mask that is used to AND the reference value and the stored stencil value when the test is done. The default value is all 1.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
     */
    stencilFunc(func: StencilFunc, ref: GLint, mask: GLuint): void
    {
        const { gl } = this._webGLRenderer;
        gl.stencilFunc(gl[func], ref, mask);
    }

    // stencilFuncSeparate(face: GLenum, func: GLenum, ref: GLint, mask: GLuint): void;

    /**
     * The WebGLRenderingContext.stencilMask() method of the WebGL API controls enabling and disabling of both the front and back writing of individual bits in the stencil planes.
     *
     * The WebGLRenderingContext.stencilMaskSeparate() method can set front and back stencil writemasks to different values.
     *
     * @param mask A GLuint specifying a bit mask to enable or disable writing of individual bits in the stencil planes. By default, the mask is all 1.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
     */
    stencilMask(mask: GLuint): void
    {
        const { gl } = this._webGLRenderer;
        gl.stencilMask(mask);
    }

    // stencilMaskSeparate(face: GLenum, mask: GLuint): void;

    /**
     * The WebGLRenderingContext.stencilOp() method of the WebGL API sets both the front and back-facing stencil test actions.
     *
     * @param fail A GLenum specifying the function to use when the stencil test fails. The default value is gl.KEEP.
     * @param zfail A GLenum specifying the function to use when the stencil test passes, but the depth test fails. The default value is gl.KEEP.
     * @param zpassA GLenum specifying the function to use when both the stencil test and the depth test pass, or when the stencil test passes and there is no depth buffer or depth testing is disabled. The default value is gl.KEEP.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp
     */
    stencilOp(fail: StencilOp, zfail: StencilOp, zpass: StencilOp): void
    {
        const { gl } = this._webGLRenderer;
        gl.stencilOp(gl[fail], gl[zfail], gl[zpass]);
    }

    // stencilOpSeparate(face: GLenum, fail: GLenum, zfail: GLenum, zpass: GLenum): void;

    /**
     * The WebGLRenderingContext.texParameter[fi]() methods of the WebGL API set texture parameters.
     *
     * @param target A GLenum specifying the binding point (target).
     * @param pname The param parameter is a GLfloat or GLint specifying the value for the specified parameter
     * @param param The pname parameter is a GLenum specifying the texture parameter to set.
     *
     * @see The WebGLRenderingContext.texParameter[fi]() methods of the WebGL API set texture parameters.
     */
    texParameterf<K extends keyof TexParameterf>(target: TextureTarget, pname: K, param: TexParameterf[K]): void
    {
        const { gl2 } = this._webGLRenderer;
        let paramV: GLint = param as any;
        if (typeof paramV === 'string')
        {
            paramV = gl2[paramV];
        }
        gl2.texParameterf(gl2[target], gl2[pname as any], paramV);
    }

    /**
     * The WebGLRenderingContext.texParameter[fi]() methods of the WebGL API set texture parameters.
     *
     * @param target A GLenum specifying the binding point (target).
     * @param pname The param parameter is a GLfloat or GLint specifying the value for the specified parameter
     * @param param The pname parameter is a GLenum specifying the texture parameter to set.
     *
     * @see The WebGLRenderingContext.texParameter[fi]() methods of the WebGL API set texture parameters.
     */
    texParameteri<K extends keyof TexParameteri>(target: TextureTarget, pname: K, param: TexParameteri[K]): void
    {
        const { gl2 } = this._webGLRenderer;
        let paramV: GLint = param as any;
        if (typeof paramV === 'string')
        {
            paramV = gl2[paramV];
        }
        gl2.texParameteri(gl2[target], gl2[pname], paramV);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param x A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform1f(location: WebGLUniformLocation | null, x: GLfloat): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform1f(location, x);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param x A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform1i(location: WebGLUniformLocation | null, x: GLint): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform1i(location, x);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param x A new value to be used for the uniform variable.
     * @param y A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform2f(location: WebGLUniformLocation | null, x: GLfloat, y: GLfloat): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform2f(location, x, y);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param x A new value to be used for the uniform variable.
     * @param y A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform2i(location: WebGLUniformLocation | null, x: GLint, y: GLint): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform2i(location, x, y);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param x A new value to be used for the uniform variable.
     * @param y A new value to be used for the uniform variable.
     * @param z A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform3f(location: WebGLUniformLocation | null, x: GLfloat, y: GLfloat, z: GLfloat): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform3f(location, x, y, z);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param x A new value to be used for the uniform variable.
     * @param y A new value to be used for the uniform variable.
     * @param z A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform3i(location: WebGLUniformLocation | null, x: GLint, y: GLint, z: GLint): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform3i(location, x, y, z);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param x A new value to be used for the uniform variable.
     * @param y A new value to be used for the uniform variable.
     * @param z A new value to be used for the uniform variable.
     * @param w A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform4f(location: WebGLUniformLocation | null, x: GLfloat, y: GLfloat, z: GLfloat, w: GLfloat): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform4f(location, x, y, z, w);
    }

    /**
     * The WebGLRenderingContext.uniform[1234][fi][v]() methods of the WebGL API specify values of uniform variables. All active uniform variables defined in a program object are initialized to 0 when the program object is linked successfully. They retain the values assigned to them by a call to this method until the next successful link operation occurs on the program object, when they are once again initialized to 0.
     *
     * @param location A WebGLUniformLocation object containing the location of the uniform attribute to modify.
     * @param x A new value to be used for the uniform variable.
     * @param y A new value to be used for the uniform variable.
     * @param z A new value to be used for the uniform variable.
     * @param w A new value to be used for the uniform variable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform4i(location: WebGLUniformLocation | null, x: GLint, y: GLint, z: GLint, w: GLint): void
    {
        const { gl } = this._webGLRenderer;
        gl.uniform4i(location, x, y, z, w);
    }

    /**
     * The WebGLRenderingContext.useProgram() method of the WebGL API sets the specified WebGLProgram as part of the current rendering state.
     *
     * @param program A WebGLProgram to use.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram
     */
    useProgram(program: WebGLProgram | null): void
    {
        const { gl } = this._webGLRenderer;
        gl.useProgram(program);
    }

    // validateProgram(program: WebGLProgram): void;
    // vertexAttrib1f(index: GLuint, x: GLfloat): void;
    // vertexAttrib1fv(index: GLuint, values: Float32List): void;
    // vertexAttrib2f(index: GLuint, x: GLfloat, y: GLfloat): void;
    // vertexAttrib2fv(index: GLuint, values: Float32List): void;
    // vertexAttrib3f(index: GLuint, x: GLfloat, y: GLfloat, z: GLfloat): void;
    // vertexAttrib3fv(index: GLuint, values: Float32List): void;
    // vertexAttrib4f(index: GLuint, x: GLfloat, y: GLfloat, z: GLfloat, w: GLfloat): void;
    // vertexAttrib4fv(index: GLuint, values: Float32List): void;

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
