import { CanvasTexture } from './CanvasTexture';
import { TextureDataSource } from './TextureDataSource';
import { TextureImageSource } from './TextureImageSource';

/**
 * 类似纹理，包含画布纹理以及正常纹理。
 *
 * 如需扩展 ITextureLike，则需在 ITextureMap 中添加类型。
 */
export type TextureLike = TextureLikeMap[keyof TextureLikeMap];

/**
 * 如需扩展 ITextureLike，则需在 ITextureMap 中添加类型。
 */
export interface TextureLikeMap
{
    /**
     * 正常纹理。
     */
    Texture: Texture;

    /**
     * 画布纹理。
     */
    CanvasTexture: CanvasTexture;
}

/**
 * 纹理描述。
 */
export interface TextureDescriptor
{
    /**
     * 标签。
     *
     * 用于调试。
     *
     * 注：修改后将重新创建纹理。
     */
    readonly label?: string;

    /**
     * The width, height, and depth or layer count of the texture.
     *
     * 由于通过初始化时写入的资源自动计算尺寸处理所有情况难度很大且容易出错，该属性在初始化时必须设置。
     *
     * 修改尺寸将会引发纹理销毁，使用时重新创建新纹理。
     */
    readonly size: TextureSize;

    /**
     * 纹理维度，默认为 "2d" 。
     *
     * 注：修改后将重新创建纹理。
     */
    readonly dimension?: TextureDimension;

    /**
     * 纹理格式。 默认为 "rgba8unorm"，
     *
     * 注：修改后将重新创建纹理。
     */
    readonly format?: TextureFormat;

    /**
     * The number of mip levels the texture will contain.
     *
     * 注：修改后将重新创建纹理。
     */
    readonly mipLevelCount?: number;

    /**
     * 是否生成mipmap
     *
     * 仅在纹理创建时执行。
     *
     * 注：修改后将重新创建纹理。
     */
    readonly generateMipmap?: boolean;

    /**
     * The sample count of the texture. A {@link GPUTextureDescriptor#sampleCount} &gt; `1` indicates
     * a multisampled texture.
     *
     * WebGPU只支持4重采样。
     *
     * 注：修改后将重新创建纹理。
     */
    readonly sampleCount?: 4;

    /**
     * Specifies what view format values will be allowed when calling
     * {@link GPUTexture#createView} on this texture (in addition to the texture's actual format).
     *
     * <div class=note heading>
     * Adding a format to this list may have a significant performance impact, so it is best
     * to avoid adding formats unnecessarily.
     * The actual performance impact is highly dependent on the target system; developers must
     * test various systems to find out the impact on their particular application.
     * For example, on some systems any texture with a format or viewFormats entry including
     * {@link GPUTextureFormat#"rgba8unorm-srgb"} will perform less optimally than a
     * {@link GPUTextureFormat#"rgba8unorm"} texture which does not.
     * Similar caveats exist for other formats and pairs of formats on other systems.
     * </div>
     * Formats in this list must be texture view format compatible with the texture format.
     * Two {@link GPUTextureFormat}s `format` and `viewFormat` are <dfn dfn for="">texture view format compatible</dfn> if:
     * - `format` equals `viewFormat`, or
     * - `format` and `viewFormat` differ only in whether they are `srgb` formats (have the `-srgb` suffix).
     *
     * @see GPUDevice.createTexture
     * @see GPUTextureDescriptor
     */
    viewFormats?: Iterable<TextureFormat>;
}

/**
 * 纹理
 */
export interface Texture
{
    /**
     * 纹理描述。
     *
     * 注：修改后将重新创建纹理。
     */
    readonly descriptor: TextureDescriptor;

    /**
     * 初始化纹理资源。
     *
     * @see GPUQueue.copyExternalImageToTexture
     * @see GPUQueue.writeTexture
     *
     * 注：修改后将重新创建纹理。
     */
    readonly sources?: readonly TextureSource[];

    /**
     * 写入纹理资源。
     *
     * @see GPUQueue.copyExternalImageToTexture
     * @see GPUQueue.writeTexture
     */
    readonly writeTextures?: readonly TextureSource[];
}

export class Texture
{
    /**
     * 获取纹理每个像素占用的字节数量。
     *
     * @param format 纹理格式。
     */
    static getTextureBytesPerPixel(format: TextureFormat = 'rgba8unorm')
    {
        const bytesPerPixel = formatMap[format]?.bytesPerPixel;

        console.assert(!!bytesPerPixel, `未处理格式 ${format} ，无法查询到该格式中每个像素占用的字节数量！`);

        return bytesPerPixel;
    }

    /**
     * 获取纹理数据构造函数。

     * @param format 纹理格式。
     * @returns
     */
    static getTextureDataConstructor(format: TextureFormat = 'rgba8unorm')
    {
        const bytesPerPixel = formatMap[format]?.dataConstructor;

        console.assert(!!bytesPerPixel, `未处理格式 ${format} ，无法查询到该格式的纹理数据构造函数！`);

        return bytesPerPixel;
    }
}

/**
 * 纹理资源。
 */
export type TextureSource = ITextureSourceMap[keyof ITextureSourceMap];

export interface ITextureSourceMap
{
    ITextureImageSource: TextureImageSource;
    ITextureDataSource: TextureDataSource;
}

/**
 * 纹理数据布局。
 */
export interface TextureDataLayout
{
    /**
     * 默认为 0。字节偏移，一般用于跳过文件头部非纹理数据部分。
     */
    offset?: number;

    /**
     * 图片宽度。
     *
     * 默认值为 ITextureDataSource.size[0] 。
     */
    width?: number;

    /**
     * 单张图片高度。只在纹理为2d纹理数组或者3d纹理时生效。
     *
     * 默认值为 ITextureDataSource.size[1] 。
     */
    height?: number;
}

/**
 * 图片中的坐标。
 */
export type ImageOrigin = readonly [x: number, y: number];

/**
 * 数据图片中的坐标。depthOrArrayLayers 表示数据中包含有多张图片中的第几张，只在纹理为2d纹理数组或者3d纹理时生效。
 */
export type DataImageOrigin = readonly [x: number, y: number, depthOrArrayLayers?: number];

/**
 * 图片尺寸
 */
export type ImageSize = readonly [width: number, height: number];

/**
 * 纹理尺寸，包含纹理的宽度、高度以及深度或者层数。
 *
 * depthOrArrayLayers: 当纹理为3d纹理时表示深度，2d纹理数组时表示数组索引，cube纹理时表示6个面的索引。
 */
export type TextureSize = readonly [width: number, height: number, depthOrArrayLayers?: number];

/**
 * 纹理内的坐标位置。
 */
export type TextureOrigin = readonly [x: number, y: number, depthOrArrayLayers?: number];

/**
 * 纹理规格维度。
 */
export type TextureDimension = '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';

/**
 * 纹理格式，兼容 GPUTextureFormat 并添加额外格式
 */
export type TextureFormat = GPUTextureFormat | 'eac-rsnorm' | 'eac-rgsnorm';

const formatMap: {
    [key: string]: {
        /**
         * 每个像素占用的字节数量
         */
        bytesPerPixel: number,

        /**
         * 数据构造函数
         */
        dataConstructor?: Uint8ArrayConstructor | Int8ArrayConstructor
        | Uint16ArrayConstructor | Int16ArrayConstructor
        | Uint32ArrayConstructor | Int32ArrayConstructor
        | Float32ArrayConstructor,
    }
} = {
    r8unorm: { bytesPerPixel: 1, dataConstructor: Uint8Array },
    r8snorm: { bytesPerPixel: 1, dataConstructor: Int8Array },
    r8uint: { bytesPerPixel: 1, dataConstructor: Uint8Array },
    r8sint: { bytesPerPixel: 1, dataConstructor: Int8Array },
    r16uint: { bytesPerPixel: 2, dataConstructor: Uint16Array },
    r16sint: { bytesPerPixel: 2, dataConstructor: Int16Array },
    r16float: { bytesPerPixel: 2, dataConstructor: Uint16Array },
    rg8unorm: { bytesPerPixel: 2, dataConstructor: Uint8Array },
    rg8snorm: { bytesPerPixel: 2, dataConstructor: Int8Array },
    rg8uint: { bytesPerPixel: 2, dataConstructor: Uint8Array },
    rg8sint: { bytesPerPixel: 2, dataConstructor: Int8Array },
    r32uint: { bytesPerPixel: 4, dataConstructor: Uint32Array },
    r32sint: { bytesPerPixel: 4, dataConstructor: Int32Array },
    r32float: { bytesPerPixel: 4, dataConstructor: Float32Array },
    rg16uint: { bytesPerPixel: 4, dataConstructor: Uint16Array },
    rg16sint: { bytesPerPixel: 4, dataConstructor: Int16Array },
    rg16float: { bytesPerPixel: 4, dataConstructor: Uint16Array },
    rgba8unorm: { bytesPerPixel: 4, dataConstructor: Uint8Array },
    'rgba8unorm-srgb': { bytesPerPixel: 4, dataConstructor: Uint8Array },
    rgba8snorm: { bytesPerPixel: 4, dataConstructor: Int8Array },
    rgba8uint: { bytesPerPixel: 4, dataConstructor: Uint8Array },
    rgba8sint: { bytesPerPixel: 4, dataConstructor: Int8Array },
    bgra8unorm: { bytesPerPixel: 4, dataConstructor: Uint8Array },
    'bgra8unorm-srgb': { bytesPerPixel: 4, dataConstructor: Uint8Array },
    rgb9e5ufloat: { bytesPerPixel: 4, dataConstructor: Uint32Array },
    rgb10a2uint: { bytesPerPixel: 4, dataConstructor: Uint32Array },
    rgb10a2unorm: { bytesPerPixel: 4, dataConstructor: Uint32Array },
    rg11b10ufloat: { bytesPerPixel: 4, dataConstructor: Uint32Array },
    rg32uint: { bytesPerPixel: 8, dataConstructor: Uint32Array },
    rg32sint: { bytesPerPixel: 8, dataConstructor: Int32Array },
    rg32float: { bytesPerPixel: 8, dataConstructor: Float32Array },
    rgba16uint: { bytesPerPixel: 8, dataConstructor: Uint16Array },
    rgba16sint: { bytesPerPixel: 8, dataConstructor: Int16Array },
    rgba16float: { bytesPerPixel: 8, dataConstructor: Uint16Array },
    rgba32uint: { bytesPerPixel: 16, dataConstructor: Uint32Array },
    rgba32sint: { bytesPerPixel: 16, dataConstructor: Int32Array },
    rgba32float: { bytesPerPixel: 16, dataConstructor: Float32Array },
    stencil8: { bytesPerPixel: 1, dataConstructor: Uint8Array },
    depth16unorm: { bytesPerPixel: 2, dataConstructor: Uint16Array },
    depth24plus: { bytesPerPixel: 3, dataConstructor: Uint8Array },
    'depth24plus-stencil8': { bytesPerPixel: 4 },
    depth32float: { bytesPerPixel: 4 },
    'depth32float-stencil8': { bytesPerPixel: 5 },
    'bc1-rgba-unorm': undefined,
    'bc1-rgba-unorm-srgb': undefined,
    'bc2-rgba-unorm': undefined,
    'bc2-rgba-unorm-srgb': undefined,
    'bc3-rgba-unorm': undefined,
    'bc3-rgba-unorm-srgb': undefined,
    'bc4-r-unorm': undefined,
    'bc4-r-snorm': undefined,
    'bc5-rg-unorm': undefined,
    'bc5-rg-snorm': undefined,
    'bc6h-rgb-ufloat': undefined,
    'bc6h-rgb-float': undefined,
    'bc7-rgba-unorm': undefined,
    'bc7-rgba-unorm-srgb': undefined,
    'etc2-rgb8unorm': undefined,
    'etc2-rgb8unorm-srgb': undefined,
    'etc2-rgb8a1unorm': undefined,
    'etc2-rgb8a1unorm-srgb': undefined,
    'etc2-rgba8unorm': undefined,
    'etc2-rgba8unorm-srgb': undefined,
    'eac-r11unorm': undefined,
    'eac-rsnorm': undefined,
    'eac-rg11unorm': undefined,
    'eac-rgsnorm': undefined,
    'astc-4x4-unorm': undefined,
    'astc-4x4-unorm-srgb': undefined,
    'astc-5x4-unorm': undefined,
    'astc-5x4-unorm-srgb': undefined,
    'astc-5x5-unorm': undefined,
    'astc-5x5-unorm-srgb': undefined,
    'astc-6x5-unorm': undefined,
    'astc-6x5-unorm-srgb': undefined,
    'astc-6x6-unorm': undefined,
    'astc-6x6-unorm-srgb': undefined,
    'astc-8x5-unorm': undefined,
    'astc-8x5-unorm-srgb': undefined,
    'astc-8x6-unorm': undefined,
    'astc-8x6-unorm-srgb': undefined,
    'astc-8x8-unorm': undefined,
    'astc-8x8-unorm-srgb': undefined,
    'astc-10x5-unorm': undefined,
    'astc-10x5-unorm-srgb': undefined,
    'astc-10x6-unorm': undefined,
    'astc-10x6-unorm-srgb': undefined,
    'astc-10x8-unorm': undefined,
    'astc-10x8-unorm-srgb': undefined,
    'astc-10x10-unorm': undefined,
    'astc-10x10-unorm-srgb': undefined,
    'astc-12x10-unorm': undefined,
    'astc-12x10-unorm-srgb': undefined,
    'astc-12x12-unorm': undefined,
    'astc-12x12-unorm-srgb': undefined,
};
