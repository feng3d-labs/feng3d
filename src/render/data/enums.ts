/**
 * 渲染相关枚举集合。
 *
 * 这些枚举原属 @feng3d/renderer（WebGL/GLSL 体系），现迁移到 core 内部，
 * 作为 core 的渲染数据描述层。它们是纯字符串/数值字面量，不涉及任何 WebGL API。
 * 在 WebGPU 渲染路径下，由 {@link render/webgpu/MaterialPipeline} 负责将这些
 * GL 语义枚举映射为 WebGPU 的渲染状态（小写、连字符形式）。
 */

/**
 * 渲染模式，描述绘制图元的类型。
 */
export enum RenderMode
{
    /** 绘制单个点。 */
    POINTS = 'POINTS',
    /** 绘制循环连线。 */
    LINE_LOOP = 'LINE_LOOP',
    /** 绘制连线。 */
    LINE_STRIP = 'LINE_STRIP',
    /** 每两个顶点绘制一条线段。 */
    LINES = 'LINES',
    /** 每三个顶点绘制一个三角形。 */
    TRIANGLES = 'TRIANGLES',
    /** 绘制三角形条带。 */
    TRIANGLE_STRIP = 'TRIANGLE_STRIP',
    /** 绘制三角扇形。 */
    TRIANGLE_FAN = 'TRIANGLE_FAN',
}

/**
 * 裁剪面枚举。
 *
 * 注意：WebGPU 的 CullFace 仅支持 none/front/back，FRONT_AND_BACK 会被
 * {@link render/webgpu/MaterialPipeline.mapCullFace} 退化为 front。
 */
export enum CullFace
{
    /** 关闭裁剪面。 */
    NONE = 'NONE',
    /** 正面。 */
    FRONT = 'FRONT',
    /** 背面。 */
    BACK = 'BACK',
    /** 正面与背面。 */
    FRONT_AND_BACK = 'FRONT_AND_BACK',
}

/**
 * 正面方向枚举。
 */
export enum FrontFace
{
    /** 顺时针方向。 */
    CW = 'CW',
    /** 逆时针方向。 */
    CCW = 'CCW',
}

/**
 * 混合因子。
 *
 * 混合公式：color(RGBA) = (sourceColor * sfactor) + (destinationColor * dfactor)。
 */
export enum BlendFactor
{
    ZERO = 'ZERO',
    ONE = 'ONE',
    SRC_COLOR = 'SRC_COLOR',
    ONE_MINUS_SRC_COLOR = 'ONE_MINUS_SRC_COLOR',
    DST_COLOR = 'DST_COLOR',
    ONE_MINUS_DST_COLOR = 'ONE_MINUS_DST_COLOR',
    SRC_ALPHA = 'SRC_ALPHA',
    ONE_MINUS_SRC_ALPHA = 'ONE_MINUS_SRC_ALPHA',
    DST_ALPHA = 'DST_ALPHA',
    ONE_MINUS_DST_ALPHA = 'ONE_MINUS_DST_ALPHA',
    SRC_ALPHA_SATURATE = 'SRC_ALPHA_SATURATE',
}

/**
 * 混合方法。
 */
export enum BlendEquation
{
    /** 源 + 目标。 */
    FUNC_ADD = 'FUNC_ADD',
    /** 源 - 目标。 */
    FUNC_SUBTRACT = 'FUNC_SUBTRACT',
    /** 目标 - 源。 */
    FUNC_REVERSE_SUBTRACT = 'FUNC_REVERSE_SUBTRACT',
}

/**
 * 颜色写入掩码（位掩码）。
 */
export enum ColorMask
{
    NONE = 0,
    R = 1,
    G = 2,
    B = 4,
    A = 8,
    RGB = R | G | B,
    RGBA = R | G | B | A,
}

/**
 * 深度比较函数。
 */
export enum DepthFunc
{
    NEVER = 'NEVER',
    LESS = 'LESS',
    EQUAL = 'EQUAL',
    LEQUAL = 'LEQUAL',
    GREATER = 'GREATER',
    NOTEQUAL = 'NOTEQUAL',
    GEQUAL = 'GEQUAL',
    ALWAYS = 'ALWAYS',
}

/**
 * 纹理颜色格式。
 *
 * 注意：这是 GL 语义格式（如 RGBA），与 WebGPU 的 GPUTextureFormat（如 rgba8unorm）
 * 不同。WebGPU 路径下纹理格式由 webgpu 的 Texture.descriptor.format 直接指定。
 */
export enum TextureFormat
{
    ALPHA = 'ALPHA',
    RGB = 'RGB',
    RGBA = 'RGBA',
    LUMINANCE = 'LUMINANCE',
    LUMINANCE_ALPHA = 'LUMINANCE_ALPHA',
}

/**
 * 纹理类型（纹理目标）。
 */
export enum TextureType
{
    /** 二维纹理。 */
    TEXTURE_2D = 'TEXTURE_2D',
    /** 立方体纹理。 */
    TEXTURE_CUBE_MAP = 'TEXTURE_CUBE_MAP',
}

/**
 * 纹理数据类型（每通道数据类型）。
 *
 * 注意：WebGPU 中数据类型已合进 TextureFormat（如 rgba8unorm），无独立概念。
 */
export enum TextureDataType
{
    UNSIGNED_BYTE = 'UNSIGNED_BYTE',
    UNSIGNED_SHORT_5_6_5 = 'UNSIGNED_SHORT_5_6_5',
    UNSIGNED_SHORT_4_4_4_4 = 'UNSIGNED_SHORT_4_4_4_4',
    UNSIGNED_SHORT_5_5_5_1 = 'UNSIGNED_SHORT_5_5_5_1',
}

/**
 * 纹理坐标包装函数。
 */
export enum TextureWrap
{
    REPEAT = 'REPEAT',
    CLAMP_TO_EDGE = 'CLAMP_TO_EDGE',
    MIRRORED_REPEAT = 'MIRRORED_REPEAT',
}

/**
 * 纹理缩小过滤器。
 */
export enum TextureMinFilter
{
    LINEAR = 'LINEAR',
    NEAREST = 'NEAREST',
    NEAREST_MIPMAP_NEAREST = 'NEAREST_MIPMAP_NEAREST',
    LINEAR_MIPMAP_NEAREST = 'LINEAR_MIPMAP_NEAREST',
    NEAREST_MIPMAP_LINEAR = 'NEAREST_MIPMAP_LINEAR',
    LINEAR_MIPMAP_LINEAR = 'LINEAR_MIPMAP_LINEAR',
}

/**
 * 纹理放大过滤器。
 */
export enum TextureMagFilter
{
    LINEAR = 'LINEAR',
    NEAREST = 'NEAREST',
}
