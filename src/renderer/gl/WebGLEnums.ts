/**
 * A GLenum specifying the intended usage pattern of the data store for optimization purposes. Possible values:
 *
 * * gl.STATIC_DRAW: The contents are intended to be specified once by the application, and used many times as the source for WebGL drawing and image specification commands.
 * * gl.DYNAMIC_DRAW: The contents are intended to be respecified repeatedly by the application, and used many times as the source for WebGL drawing and image specification commands.
 * * gl.STREAM_DRAW: The contents are intended to be specified once by the application, and used at most a few times as the source for WebGL drawing and image specification commands.
 *
 * When using a WebGL 2 context, the following values are available additionally:
 *
 * * gl.STATIC_READ     The contents are intended to be specified once by reading data from WebGL, and queried many times by the application.
 * * gl.DYNAMIC_READ    The contents are intended to be respecified repeatedly by reading data from WebGL, and queried many times by the application.
 * * gl.STREAM_READ     The contents are intended to be specified once by reading data from WebGL, and queried at most a few times by the application
 * * gl.STATIC_COPY     The contents are intended to be specified once by reading data from WebGL, and used many times as the source for WebGL drawing and image specification commands.
 * * gl.DYNAMIC_COPY    The contents are intended to be respecified repeatedly by reading data from WebGL, and used many times as the source for WebGL drawing and image specification commands.
 * * gl.STREAM_COPY     The contents are intended to be specified once by reading data from WebGL, and used at most a few times as the source for WebGL drawing and image specification commands.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
 */
export type BufferUsage = 'STATIC_DRAW' | 'DYNAMIC_DRAW' | 'STREAM_DRAW' // WebGL1
    | 'STATIC_READ' | 'DYNAMIC_READ' | 'STREAM_READ' | 'STATIC_COPY' | 'DYNAMIC_COPY' | 'STREAM_COPY' // WebGL2
    ;

/**
 * A GLenum specifying the binding point (target). Possible values:
 *
 * * gl.ARRAY_BUFFER: Buffer containing vertex attributes, such as vertex coordinates, texture coordinate data, or vertex color data.
 * * gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
 *
 * When using a WebGL 2 context, the following values are available additionally:
 * * gl.COPY_READ_BUFFER: Buffer for copying from one buffer object to another.
 * * gl.COPY_WRITE_BUFFER: Buffer for copying from one buffer object to another.
 * * gl.TRANSFORM_FEEDBACK_BUFFER: Buffer for transform feedback operations.
 * * gl.UNIFORM_BUFFER: Buffer used for storing uniform blocks.
 * * gl.PIXEL_PACK_BUFFER: Buffer used for pixel transfer operations.
 * * gl.PIXEL_UNPACK_BUFFER: Buffer used for pixel transfer operations.
 *
 */
export type BufferTarget = 'ARRAY_BUFFER' | 'ELEMENT_ARRAY_BUFFER' // WebGL1
    | 'COPY_READ_BUFFER' | 'COPY_WRITE_BUFFER' | 'TRANSFORM_FEEDBACK_BUFFER'// WebGL2
    | 'UNIFORM_BUFFER' | 'PIXEL_PACK_BUFFER' | 'PIXEL_UNPACK_BUFFER'; // WebGL2

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
export type Capability =
    'BLEND' | 'CULL_FACE' | 'DEPTH_TEST' | 'DITHER'
    | 'POLYGON_OFFSET_FILL' | 'SAMPLE_ALPHA_TO_COVERAGE' | 'SAMPLE_COVERAGE'
    | 'SCISSOR_TEST'
    | 'STENCIL_TEST'
    | 'RASTERIZER_DISCARD'
    ;

/**
 * A GLenum specifying the format of the pixel data. Possible values:
 *
 * * gl.ALPHA Discards the red, green and blue components and reads the alpha component.
 * * gl.RGB   Discards the alpha components and reads the red, green and blue components.
 * * gl.RGBA  Red, green, blue and alpha components are read from the color buffer.
 *
 * WebGL2 adds
 *
 * * gl.RED
 * * gl.RG
 * * gl.RED_INTEGER
 * * gl.RG_INTEGER
 * * gl.RGB_INTEGER
 * * gl.RGBA_INTEGER
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels
 */
export type ReadPixelsFormat = 'ALPHA' | 'RGB' | 'RGBA' // WebGL1
    | 'RED' | 'RG' | 'RED_INTEGER' | 'RG_INTEGER' | 'RGB_INTEGER' | 'RGBA_INTEGER' // WebGL2
    ;

/**
 * A GLenum specifying the data type of the pixel data. Possible values:
 * * gl.UNSIGNED_BYTE
 * * gl.UNSIGNED_SHORT_5_6_5
 * * gl.UNSIGNED_SHORT_4_4_4_4
 * * gl.UNSIGNED_SHORT_5_5_5_1
 * * gl.FLOAT
 *
 * WebGL2 adds
 * * gl.BYTE
 * * gl.UNSIGNED_INT_2_10_10_10_REV
 * * gl.HALF_FLOAT
 * * gl.SHORT
 * * gl.UNSIGNED_SHORT
 * * gl.INT
 * * gl.UNSIGNED_INT
 * * gl.UNSIGNED_INT_10F_11F_11F_REV
 * * gl.UNSIGNED_INT_5_9_9_9_REV
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels
 */
export type ReadPixelsType =
    | 'UNSIGNED_BYTE'
    | 'UNSIGNED_SHORT_5_6_5'
    | 'UNSIGNED_SHORT_4_4_4_4'
    | 'UNSIGNED_SHORT_5_5_5_1'
    | 'FLOAT'
    | 'BYTE'
    | 'UNSIGNED_INT_2_10_10_10_REV'
    | 'HALF_FLOAT'
    | 'SHORT'
    | 'UNSIGNED_SHORT'
    | 'INT'
    | 'UNSIGNED_INT'
    | 'UNSIGNED_INT_10F_11F_11F_REV'
    | 'UNSIGNED_INT_5_9_9_9_REV'
    ;

/**
 * 纹理数据类型
 *
 * A GLenum specifying the data type of the texel data. Possible values:
 * * gl.UNSIGNED_BYTE: 8 bits per channel for gl.RGBA
 * * gl.UNSIGNED_SHORT_5_6_5: 5 red bits, 6 green bits, 5 blue bits.
 * * gl.UNSIGNED_SHORT_4_4_4_4: 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits.
 * * gl.UNSIGNED_SHORT_5_5_5_1: 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
 *
 * When using the WEBGL_depth_texture extension:
 * * gl.UNSIGNED_SHORT
 * * gl.UNSIGNED_INT
 * * ext.UNSIGNED_INT_24_8_WEBGL (constant provided by the extension)
 *
 * When using the OES_texture_float extension:
 * * gl.FLOAT
 *
 * When using the OES_texture_half_float extension:
 * * ext.HALF_FLOAT_OES (constant provided by the extension)
 *
 * When using a WebGL 2 context, the following values are available additionally:
 * * gl.BYTE
 * * gl.UNSIGNED_SHORT
 * * gl.SHORT
 * * gl.UNSIGNED_INT
 * * gl.INT
 * * gl.HALF_FLOAT
 * * gl.FLOAT
 * * gl.UNSIGNED_INT_2_10_10_10_REV
 * * gl.UNSIGNED_INT_10F_11F_11F_REV
 * * gl.UNSIGNED_INT_5_9_9_9_REV
 * * gl.UNSIGNED_INT_24_8
 * * gl.FLOAT_32_UNSIGNED_INT_24_8_REV (pixels must be null)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
 */
export type TextureDataType = 'UNSIGNED_BYTE' | 'UNSIGNED_SHORT_5_6_5' | 'UNSIGNED_SHORT_4_4_4_4' | 'UNSIGNED_SHORT_5_5_5_1' // WebGL1
    | 'UNSIGNED_SHORT' | 'UNSIGNED_INT' | 'UNSIGNED_INT_24_8_WEBGL' // WEBGL_depth_texture
    | 'FLOAT' // OES_texture_float
    | 'HALF_FLOAT_OES' //  OES_texture_half_float
    | 'BYTE' | 'UNSIGNED_SHORT' | 'SHORT' | 'UNSIGNED_INT' | 'INT' | 'HALF_FLOAT' | 'FLOAT' | 'UNSIGNED_INT_2_10_10_10_REV' // WebGL2
    | 'UNSIGNED_INT_10F_11F_11F_REV' | 'UNSIGNED_INT_5_9_9_9_REV' | 'UNSIGNED_INT_24_8' | 'FLOAT_32_UNSIGNED_INT_24_8_REV' // WebGL2
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
 * * gl.TEXTURE_2D: A two-dimensional texture.
 * * gl.TEXTURE_CUBE_MAP: A cube-mapped texture.
 *
 * When using a WebGL 2 context, the following values are available additionally:
 *
 * * gl.TEXTURE_3D: A three-dimensional texture.
 * * gl.TEXTURE_2D_ARRAY: A two-dimensional array texture.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
 */
export type TextureTarget = 'TEXTURE_2D' | 'TEXTURE_CUBE_MAP' | 'TEXTURE_3D' | 'TEXTURE_2D_ARRAY';

/**
 * The pname parameter is a GLenum specifying the texture parameter to set.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
 */
export interface TexParameteri extends TexParameteri_WebGL2
{
    /**
     * Texture magnification filter
     */
    TEXTURE_MAG_FILTER: TextureMagFilter;

    /**
     * Texture minification filter
     */
    TEXTURE_MIN_FILTER: TextureMinFilter;

    /**
     * Wrapping function for texture coordinate s
     */
    TEXTURE_WRAP_S: TextureWrap;

    /**
     * Wrapping function for texture coordinate t
     */
    TEXTURE_WRAP_T: TextureWrap;
}

/**
 * The pname parameter is a GLenum specifying the texture parameter to set.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
 */
export interface TexParameterf
{
    /**
     * 	Maximum anisotropy for a texture. A GLfloat value.
     *
     * EXT_texture_filter_anisotropic
     */
    TEXTURE_MAX_ANISOTROPY_EXT: number;

    /**
     * 	Texture maximum level-of-detail value. Any float values.
     */
    TEXTURE_MAX_LOD: number;

    /**
     * TEXTURE_MIN_LOD	Texture minimum level-of-detail value	Any float values.
     */
    TEXTURE_MIN_LOD: number;
}

export interface TexParameteri_WebGL2
{
    /**
     * Texture mipmap level. Any int values.
     */
    TEXTURE_BASE_LEVEL: number;

    /**
     * Texture Comparison function
     */
    TEXTURE_COMPARE_FUNC: 'LEQUAL' | 'GEQUAL' | 'LESS' | 'GREATER' | 'EQUAL' | 'NOTEQUAL' | 'ALWAYS' | 'NEVER';

    /**
     * Texture comparison mode
     */
    TEXTURE_COMPARE_MODE: 'NONE' | 'COMPARE_REF_TO_TEXTURE';

    /**
     * 	Maximum texture mipmap array level. Any int values.
     */
    TEXTURE_MAX_LEVEL: number;

    /**
     * Wrapping function for texture coordinate r
     */
    TEXTURE_WRAP_R: TextureWrap;
}

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
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/renderbufferStorage
 */
export type Renderbuffertarget = 'RENDERBUFFER';

/**
 * A GLenum specifying the internal format of the renderbuffer. Possible values:
 *
 * * gl.RGBA4: 4 red bits, 4 green bits, 4 blue bits 4 alpha bits.
 * * gl.RGB565: 5 red bits, 6 green bits, 5 blue bits.
 * * gl.RGB5_A1: 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
 * * gl.DEPTH_COMPONENT16: 16 depth bits.
 * * gl.STENCIL_INDEX8: 8 stencil bits.
 * * gl.DEPTH_STENCIL
 *
 * When using a WebGL 2 context, the following values are available additionally:
 *
 * * gl.R8
 * * gl.R8UI
 * * gl.R8I
 * * gl.R16UI
 * * gl.R16I
 * * gl.R32UI
 * * gl.R32I
 * * gl.RG8
 * * gl.RG8UI
 * * gl.RG8I
 * * gl.RG16UI
 * * gl.RG16I
 * * gl.RG32UI
 * * gl.RG32I
 * * gl.RGB8
 * * gl.RGBA8
 * * gl.SRGB8_ALPHA8 (also available as an extension for WebGL 1, see below)
 * * gl.RGB10_A2
 * * gl.RGBA8UI
 * * gl.RGBA8I
 * * gl.RGB10_A2UI
 * * gl.RGBA16UI
 * * gl.RGBA16I
 * * gl.RGBA32I
 * * gl.RGBA32UI
 * * gl.DEPTH_COMPONENT24
 * * gl.DEPTH_COMPONENT32F
 * * gl.DEPTH24_STENCIL8
 * * gl.DEPTH32F_STENCIL8
 *
 * When using the WEBGL_color_buffer_float extension:
 *
 * * ext.RGBA32F_EXT: RGBA 32-bit floating-point type.
 * * ext.RGB32F_EXT: RGB 32-bit floating-point type.
 *
 * When using the EXT_sRGB extension:
 *
 * * ext.SRGB8_ALPHA8_EXT: 8-bit sRGB and alpha.
 *
 * When using a WebGL 2 context and the EXT_color_buffer_float extension:
 *
 * * gl.R16F
 * * gl.RG16F
 * * gl.RGBA16F
 * * gl.R32F
 * * gl.RG32F
 * * gl.RGBA32F
 * * gl.R11F_G11F_B10F
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/renderbufferStorage
 */
export type RenderbufferInternalformat = 'RGBA4' | 'RGB565' | 'RGB5_A1' | 'DEPTH_COMPONENT16' | 'STENCIL_INDEX8' | 'DEPTH_STENCIL' // WebGL1
    | 'R8' | 'R8UI' | 'R8I' | 'R16UI' | 'R16I' | 'R32UI' | 'R32I' | 'RG8' | 'RG8UI' | 'RG8I' // WebGL2
    | 'RG16UI' | 'RG16I' | 'RG32UI' | 'RG32I' | 'RGB8' | 'RGBA8' | 'SRGB8_ALPHA8' | 'RGB10_A2' // WebGL2
    | 'RGBA8UI' | 'RGBA8I' | 'RGB10_A2UI' | 'RGBA16UI' | 'RGBA16I' | 'RGBA32I' | 'RGBA32UI' // WebGL2
    | 'DEPTH_COMPONENT24' | 'DEPTH_COMPONENT32F' | 'DEPTH24_STENCIL8' | 'DEPTH32F_STENCIL8' // WebGL2
    | 'RGBA32F_EXT' | 'RGB32F_EXT' // WEBGL_color_buffer_float extension
    | 'SRGB8_ALPHA8_EXT' // EXT_sRGB extension
    | 'R16F' | 'RG16F' | 'RGBA16F' | 'R32F' | 'RG32F' | 'RGBA32F' | 'R11F_G11F_B10F' //  WebGL 2 EXT_color_buffer_float
    ;

/**
 * Shader type.
 *
 * Either a gl.FRAGMENT_SHADER or a gl.VERTEX_SHADER.
 */
export type ShaderType = 'FRAGMENT_SHADER' | 'VERTEX_SHADER';

/**
 * A GLenum specifying the information to query. Possible values:
 *
 * gl.DELETE_STATUS     Returns a GLboolean indicating whether or not the shader is flagged for deletion.
 * gl.COMPILE_STATUS    Returns a GLboolean indicating whether or not the last shader compilation was successful.
 * gl.SHADER_TYPE       Returns a GLenum indicating whether the shader is a vertex shader (gl.VERTEX_SHADER) or fragment shader (gl.FRAGMENT_SHADER) object.
 */
export interface ShaderParameter
{
    /**
     * Returns a GLboolean indicating whether or not the shader is flagged for deletion.
     */
    DELETE_STATUS: GLboolean;

    /**
     * Returns a GLboolean indicating whether or not the last shader compilation was successful.
     */
    COMPILE_STATUS: GLboolean;

    /**
     * Returns a GLenum indicating whether the shader is a vertex shader (gl.VERTEX_SHADER) or fragment shader (gl.FRAGMENT_SHADER) object.
     */
    SHADER_TYPE: number;
}

/**
 * Pixel storage parameters
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/pixelStorei
 */
export interface PixelStoreiParameter extends PixelStoreiParameter_WebGL1 { }
export interface PixelStoreiParameter_WebGL1
{
    /**
     * Packing of pixel data into memory. default 4.
     */
    PACK_ALIGNMENT: 1 | 2 | 4 | 8;

    /**
     * Unpacking of pixel data from memory. default 4.
     */
    UNPACK_ALIGNMENT: 1 | 2 | 4 | 8;

    /**
     * Flips the source data along its vertical axis if true. default false.
     */
    UNPACK_FLIP_Y_WEBGL: GLboolean;

    /**
     * Multiplies the alpha channel into the other color channels. default false.
     */
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: GLboolean;

    /**
     * Default color space conversion or no color space conversion. default gl.BROWSER_DEFAULT_WEBGL.
     */
    UNPACK_COLORSPACE_CONVERSION_WEBGL: 'BROWSER_DEFAULT_WEBGL' | 'NONE';
}

/**
 * A GLenum specifying the information to query. Possible values:
 * * gl.DELETE_STATUS       Returns a GLboolean indicating whether or not the program is flagged for deletion.
 * * gl.LINK_STATUS         Returns a GLboolean indicating whether or not the last link operation was successful.
 * * gl.VALIDATE_STATUS     Returns a GLboolean indicating whether or not the last validation operation was successful.
 * * gl.ATTACHED_SHADERS    Returns a GLint indicating the number of attached shaders to a program.
 * * gl.ACTIVE_ATTRIBUTES   Returns a GLint indicating the number of active attribute variables to a program.
 * * gl.ACTIVE_UNIFORMS     Returns a GLint indicating the number of active uniform variables to a program.
 *
 * When using a WebGL 2 context, the following values are available additionally:
 * * gl.TRANSFORM_FEEDBACK_BUFFER_MODE      Returns a GLenum indicating the buffer mode when transform feedback is active. May be gl.SEPARATE_ATTRIBS or gl.INTERLEAVED_ATTRIBS.
 * * gl.TRANSFORM_FEEDBACK_VARYINGS         Returns a GLint indicating the number of varying variables to capture in transform feedback mode.
 * * gl.ACTIVE_UNIFORM_BLOCKS               Returns a GLint indicating the number of uniform blocks containing active uniforms.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramParameter
 */
export interface ProgramParameter
{
    /**
     * Returns a GLboolean indicating whether or not the program is flagged for deletion.
     */
    DELETE_STATUS: GLboolean;

    /**
     * Returns a GLboolean indicating whether or not the last link operation was successful.
     */
    LINK_STATUS: GLboolean;

    /**
     * Returns a GLboolean indicating whether or not the last validation operation was successful.
     */
    VALIDATE_STATUS: GLboolean;

    /**
     * Returns a GLint indicating the number of attached shaders to a program.
     */
    ATTACHED_SHADERS: GLint;

    /**
     * Returns a GLint indicating the number of active attribute variables to a program.
     */
    ACTIVE_ATTRIBUTES: GLint;

    /**
     * Returns a GLint indicating the number of active uniform variables to a program.
     */
    ACTIVE_UNIFORMS: GLint;

    /**
     * Returns a GLenum indicating the buffer mode when transform feedback is active. May be gl.SEPARATE_ATTRIBS or gl.INTERLEAVED_ATTRIBS.
     */
    TRANSFORM_FEEDBACK_BUFFER_MODE: GLenum;

    /**
     * Returns a GLint indicating the number of varying variables to capture in transform feedback mode.
     */
    TRANSFORM_FEEDBACK_VARYINGS: GLint;

    /**
     * Returns a GLint indicating the number of uniform blocks containing active uniforms.
     */
    ACTIVE_UNIFORM_BLOCKS: GLint;
}

/**
 * A precision type value. Either gl.LOW_FLOAT, gl.MEDIUM_FLOAT, gl.HIGH_FLOAT, gl.LOW_INT, gl.MEDIUM_INT, or gl.HIGH_INT.
 */
export type PrecisionType = 'LOW_FLOAT' | 'MEDIUM_FLOAT' | 'HIGH_FLOAT' | 'LOW_INT' | 'MEDIUM_INT' | 'HIGH_INT';

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
