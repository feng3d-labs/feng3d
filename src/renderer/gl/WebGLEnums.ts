/**
 * A GLenum specifying the intended usage pattern of the data store for optimization purposes.
 *
 * 指定数据存储区的使用方法。
 *
 * * `STATIC_DRAW` 内容由应用程序指定一次，并多次用作WebGL绘图和图像规范命令的源。缓冲区的内容可能经常使用，而不会经常更改。内容被写入缓冲区，但不被读取。
 * * `DYNAMIC_DRAW` 这些内容将由应用程序反复重新指定，并多次用作WebGL绘图和图像规范命令的源。
 * * `STREAM_DRAW` 内容由应用程序指定一次，最多几次用作WebGL绘图和图像规范命令的源。
 *
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
 */
export type AttributeUsage = 'STATIC_DRAW' | 'DYNAMIC_DRAW' | 'STREAM_DRAW';

/**
 * A GLbitfield bitwise OR mask that indicates the buffers to be cleared. Possible values are:
 *
 * gl.COLOR_BUFFER_BIT
 * gl.DEPTH_BUFFER_BIT
 * gl.STENCIL_BUFFER_BIT
 *
 */
export type ClearMask = 'COLOR_BUFFER_BIT' | 'DEPTH_BUFFER_BIT' | 'STENCIL_BUFFER_BIT';

/**
 * A GLenum specifying which WebGL capability to enable. Possible values:
 *
 * gl.BLEND	Activates blending of the computed fragment color values. See WebGLRenderingContext.blendFunc().
 * gl.CULL_FACE	Activates culling of polygons. See WebGLRenderingContext.cullFace().
 * gl.DEPTH_TEST	Activates depth comparisons and updates to the depth buffer. See WebGLRenderingContext.depthFunc().
 * gl.DITHER	Activates dithering of color components before they get written to the color buffer.
 * gl.POLYGON_OFFSET_FILL	Activates adding an offset to depth values of polygon's fragments. See WebGLRenderingContext.polygonOffset().
 * gl.SAMPLE_ALPHA_TO_COVERAGE	Activates the computation of a temporary coverage value determined by the alpha value.
 * gl.SAMPLE_COVERAGE	Activates ANDing the fragment's coverage with the temporary coverage value. See WebGLRenderingContext.sampleCoverage().
 * gl.SCISSOR_TEST	Activates the scissor test that discards fragments that are outside of the scissor rectangle. See WebGLRenderingContext.scissor().
 * gl.STENCIL_TEST	Activates stencil testing and updates to the stencil buffer. See WebGLRenderingContext.stencilFunc().
 *
 * When using a WebGL 2 context, the following values are available additionally:
 *
 * gl.RASTERIZER_DISCARD	Primitives are discarded immediately before the rasterization stage, but after the optional transform feedback stage. gl.clear() commands are ignored.
 */
export type EnableCap =
    'BLEND' | 'CULL_FACE' | 'DEPTH_TEST' | 'DITHER'
    | 'POLYGON_OFFSET_FILL' | 'SAMPLE_ALPHA_TO_COVERAGE' | 'SAMPLE_COVERAGE'
    | 'SCISSOR_TEST'
    | 'STENCIL_TEST'
    | 'RASTERIZER_DISCARD'
    ;

/**
 * 纹理数据类型
 * A GLenum specifying the data type of the texel data
 *
 * * `UNSIGNED_BYTE` 8 bits per channel for gl.RGBA
 * * `UNSIGNED_SHORT_5_6_5` 5 red bits, 6 green bits, 5 blue bits.
 * * `UNSIGNED_SHORT_4_4_4_4` 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits.
 * * `UNSIGNED_SHORT_5_5_5_1` 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
 * * `UNSIGNED_SHORT` When using the WEBGL_depth_texture extension:
 * * `UNSIGNED_INT` When using the WEBGL_depth_texture extension:
 * * `UNSIGNED_INT_24_8_WEBGL` When using the WEBGL_depth_texture extension:(constant provided by the extension)
 * * `FLOAT` When using the OES_texture_float extension:
 * * `HALF_FLOAT_OES` When using the OES_texture_half_float extension:(constant provided by the extension)
 * * `BYTE` using a WebGL 2 context
 * * `SHORT` using a WebGL 2 context
 * * `INT` using a WebGL 2 context
 * * `HALF_FLOAT` using a WebGL 2 context
 * * `UNSIGNED_INT_2_10_10_10_REV` using a WebGL 2 context
 * * `UNSIGNED_INT_10F_11F_11F_REV` using a WebGL 2 context
 * * `UNSIGNED_INT_5_9_9_9_REV` using a WebGL 2 context
 * * `UNSIGNED_INT_24_8` using a WebGL 2 context
 * * `FLOAT_32_UNSIGNED_INT_24_8_REV` using a WebGL 2 context(pixels must be null)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
 */
export type TextureDataType = 'UNSIGNED_BYTE' | 'UNSIGNED_SHORT_5_6_5' | 'UNSIGNED_SHORT_4_4_4_4' | 'UNSIGNED_SHORT_5_5_5_1' | 'UNSIGNED_SHORT'
    | 'UNSIGNED_INT' | 'UNSIGNED_INT_24_8_WEBGL' | 'FLOAT' | 'HALF_FLOAT_OES' | 'BYTE' | 'SHORT' | 'INT'
    | 'HALF_FLOAT' | 'UNSIGNED_INT_2_10_10_10_REV' | 'UNSIGNED_INT_10F_11F_11F_REV' | 'UNSIGNED_INT_5_9_9_9_REV' | 'UNSIGNED_INT_24_8' | 'FLOAT_32_UNSIGNED_INT_24_8_REV'
    ;

/**
 * 纹理颜色格式
 * A GLint specifying the color components in the texture
 *
 * * `ALPHA` Discards the red, green and blue components and reads the alpha component.
 * * `RGB` Discards the alpha components and reads the red, green and blue components.
 * * `RGBA` Red, green, blue and alpha components are read from the color buffer.
 * * `LUMINANCE` Each color component is a luminance component, alpha is 1.0.
 * * `LUMINANCE_ALPHA` Each component is a luminance/alpha component.
 * * `DEPTH_COMPONENT` When using the WEBGL_depth_texture extension:
 * * `DEPTH_STENCIL` When using the WEBGL_depth_texture extension:
 * * `SRGB_EXT` When using the EXT_sRGB extension:
 * * `SRGB_ALPHA_EXT` When using the EXT_sRGB extension:
 * * `R8` using a WebGL 2 context
 * * `R16F` using a WebGL 2 context
 * * `R32F` using a WebGL 2 context
 * * `R8UI` using a WebGL 2 context
 * * `RG8` using a WebGL 2 context
 * * `RG16F` using a WebGL 2 context
 * * `RG32F` using a WebGL 2 context
 * * `RG8UI` using a WebGL 2 context
 * * `RG16UI` using a WebGL 2 context
 * * `RG32UI` using a WebGL 2 context
 * * `RGB8` using a WebGL 2 context
 * * `SRGB8` using a WebGL 2 context
 * * `RGB565` using a WebGL 2 context
 * * `R11F_G11F_B10F` using a WebGL 2 context
 * * `RGB9_E5` using a WebGL 2 context
 * * `RGB16F` using a WebGL 2 context
 * * `RGB32F` using a WebGL 2 context
 * * `RGB8UI` using a WebGL 2 context
 * * `RGBA8` using a WebGL 2 context
 * * `RGB5_A1` using a WebGL 2 context
 * * `RGB10_A2` using a WebGL 2 context
 * * `RGBA4` using a WebGL 2 context
 * * `RGBA16F` using a WebGL 2 context
 * * `RGBA32F` using a WebGL 2 context
 * * `RGBA8UI` using a WebGL 2 context
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
 */
export type TextureFormat = 'ALPHA' | 'RGB' | `RGBA` | `LUMINANCE` | `LUMINANCE_ALPHA` | `DEPTH_COMPONENT`
    | `DEPTH_STENCIL` | `SRGB_EXT` | `SRGB_ALPHA_EXT` | `R8` | `R16F` | `R32F`
    | `R8UI` | `RG8` | `RG16F` | `RG32F` | `RG8UI` | `RG16UI`
    | `RG32UI` | `RGB8` | `SRGB8` | `RGB565`
    | `R11F_G11F_B10F` | `RGB9_E5` | `RGB16F` | `RGB32F`
    | `RGB8UI` | `RGBA8` | `RGB5_A1` | `RGB10_A2`
    | `RGBA4` | `RGBA16F` | `RGBA32F` | `RGBA8UI`;

/**
 * 纹理放大滤波器
 * Texture magnification filter
 *
 * * `LINEAR`
 * * `NEAREST`
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
 */
export type TextureMagFilter = 'LINEAR' | 'NEAREST';

/**
 * 纹理缩小过滤器
 * Texture minification filter
 *
 * * `LINEAR`
 * * `NEAREST`
 * * `NEAREST_MIPMAP_NEAREST`
 * * `LINEAR_MIPMAP_NEAREST`
 * * `NEAREST_MIPMAP_LINEAR`
 * * `LINEAR_MIPMAP_LINEAR`
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
 */
export type TextureMinFilter = 'LINEAR' | 'NEAREST' | 'NEAREST_MIPMAP_NEAREST' | 'LINEAR_MIPMAP_NEAREST' | 'NEAREST_MIPMAP_LINEAR' | 'LINEAR_MIPMAP_LINEAR';

/**
 * A GLenum specifying the binding point (target). Possible values:
 *
 * * `TEXTURE_2D` gl.TEXTURE_2D: A two-dimensional texture.
 * * `TEXTURE_CUBE_MAP` gl.TEXTURE_CUBE_MAP: A cube-mapped texture.
 * * `TEXTURE_3D` using a WebGL 2 context gl.TEXTURE_3D: A three-dimensional texture.
 * * `TEXTURE_2D_ARRAY` using a WebGL 2 context gl.TEXTURE_2D_ARRAY: A two-dimensional array texture.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
 */
export type TextureTarget = 'TEXTURE_2D' | 'TEXTURE_CUBE_MAP' | 'TEXTURE_3D' | 'TEXTURE_2D_ARRAY';

/**
 * A GLenum specifying the texture target.
 *
 * gl.TEXTURE_2D: A two-dimensional texture.
 * gl.TEXTURE_CUBE_MAP_POSITIVE_X: Positive X face for a cube-mapped texture.
 * gl.TEXTURE_CUBE_MAP_NEGATIVE_X: Negative X face for a cube-mapped texture.
 * gl.TEXTURE_CUBE_MAP_POSITIVE_Y: Positive Y face for a cube-mapped texture.
 * gl.TEXTURE_CUBE_MAP_NEGATIVE_Y: Negative Y face for a cube-mapped texture.
 * gl.TEXTURE_CUBE_MAP_POSITIVE_Z: Positive Z face for a cube-mapped texture.
 * gl.TEXTURE_CUBE_MAP_NEGATIVE_Z: Negative Z face for a cube-mapped texture.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
 */
export type TexImage2DTarget = 'TEXTURE_2D'
    | 'TEXTURE_CUBE_MAP_POSITIVE_X'
    | 'TEXTURE_CUBE_MAP_NEGATIVE_X'
    | 'TEXTURE_CUBE_MAP_POSITIVE_Y'
    | 'TEXTURE_CUBE_MAP_NEGATIVE_Y'
    | 'TEXTURE_CUBE_MAP_POSITIVE_Z'
    | 'TEXTURE_CUBE_MAP_NEGATIVE_Z';

/**
 * 纹理坐标s包装函数枚举
 * Wrapping function for texture coordinate s
 *
 * * `REPEAT`
 * * `CLAMP_TO_EDGE`
 * * `MIRRORED_REPEAT`
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
 */
export type TextureWrap = 'REPEAT' | 'CLAMP_TO_EDGE' | 'MIRRORED_REPEAT';

/**
 * A GLenum specifying the binding point (target). Possible values:
 *
 * gl.FRAMEBUFFER   Collection buffer data storage of color, alpha, depth and stencil buffers used as both a destination for drawing and as a source for reading (see below).
 *
 * When using a WebGL 2 context, the following values are available additionally:
 *
 * gl.DRAW_FRAMEBUFFER  Used as a destination for drawing operations such as gl.draw*, gl.clear* and gl.blitFramebuffer.
 * gl.READ_FRAMEBUFFER  Used as a source for reading operations such as gl.readPixels and gl.blitFramebuffer.
 */
export type FramebufferTarget = 'FRAMEBUFFER' | 'DRAW_FRAMEBUFFER' | 'READ_FRAMEBUFFER';

/**
 * A GLenum specifying the binding point (target). Possible values:
 *
 * gl.RENDERBUFFER  Buffer data storage for single images in a renderable internal format.
 */
export type Renderbuffertarget = 'RENDERBUFFER';

/**
 * A GLenum specifying the attachment point for the texture. Possible values:
 *
 * gl.COLOR_ATTACHMENT0: Attaches the texture to the framebuffer's color buffer.
 * gl.DEPTH_ATTACHMENT: Attaches the texture to the framebuffer's depth buffer.
 * gl.STENCIL_ATTACHMENT: Attaches the texture to the framebuffer's stencil buffer.
 *
 * When using a WebGL 2 context, the following values are available additionally:
 *
 * gl.DEPTH_STENCIL_ATTACHMENT: depth and stencil buffer.
 * gl.COLOR_ATTACHMENT1 gl.COLOR_ATTACHMENT2 gl.COLOR_ATTACHMENT3 gl.COLOR_ATTACHMENT4 gl.COLOR_ATTACHMENT5 gl.COLOR_ATTACHMENT6 gl.COLOR_ATTACHMENT7 gl.COLOR_ATTACHMENT8 gl.COLOR_ATTACHMENT9 gl.COLOR_ATTACHMENT10 gl.COLOR_ATTACHMENT11 gl.COLOR_ATTACHMENT12 gl.COLOR_ATTACHMENT13 gl.COLOR_ATTACHMENT14 gl.COLOR_ATTACHMENT15
 */
export type AttachmentPoint = 'COLOR_ATTACHMENT0' | 'DEPTH_ATTACHMENT' | 'STENCIL_ATTACHMENT'
    | 'DEPTH_STENCIL_ATTACHMENT'
    | 'COLOR_ATTACHMENT1' | 'COLOR_ATTACHMENT2' | 'COLOR_ATTACHMENT3' | 'COLOR_ATTACHMENT4' | 'COLOR_ATTACHMENT5'
    | 'COLOR_ATTACHMENT6' | 'COLOR_ATTACHMENT7' | 'COLOR_ATTACHMENT8' | 'COLOR_ATTACHMENT9' | 'COLOR_ATTACHMENT10'
    | 'COLOR_ATTACHMENT11' | 'COLOR_ATTACHMENT12' | 'COLOR_ATTACHMENT13' | 'COLOR_ATTACHMENT14' | 'COLOR_ATTACHMENT15'
    ;
