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
 * 纹理类型
 * A GLenum specifying the binding point (target). Possible values:
 *
 * * `TEXTURE_2D` gl.TEXTURE_2D: A two-dimensional texture.
 * * `TEXTURE_CUBE_MAP` gl.TEXTURE_CUBE_MAP: A cube-mapped texture.
 * * `TEXTURE_3D` using a WebGL 2 context gl.TEXTURE_3D: A three-dimensional texture.
 * * `TEXTURE_2D_ARRAY` using a WebGL 2 context gl.TEXTURE_2D_ARRAY: A two-dimensional array texture.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
 */
export type TextureType = 'TEXTURE_2D' | 'TEXTURE_CUBE_MAP' | 'TEXTURE_3D' | 'TEXTURE_2D_ARRAY';

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
