// 基础类型从 TextureSharedTypes 引入（而非 Texture），以打破
// Texture → TextureDataSource → Texture 的循环依赖
import { TextureDataLayout, DataImageOrigin, TextureOrigin, TextureSize } from './TextureSharedTypes';

/**
 * 纹理的数据资源。
 *
 * @see GPUQueue.writeTexture
 */
export interface TextureDataSource
{
    /**
     * 数据类型。
     */
    readonly __type__: 'TextureDataSource';

    /**
     * 纹理数据。
     */
    data: ArrayBufferView;

    /**
     * Layout of the content in `data`.
     *
     * 纹理数据布局。
     */
    dataLayout?: TextureDataLayout;

    /**
     * 读取数据图片上的像素坐标。
     */
    dataImageOrigin?: DataImageOrigin;

    /**
     * 写入mipmap级别。
     *
     * 默认为 0。
     */
    mipLevel?: number;

    /**
     * Defines the origin of the copy - the minimum corner of the texture sub-region to copy to/from.
     * Together with `copySize`, defines the full copy sub-region.
     *
     * 写入纹理的位置。
     */
    textureOrigin?: TextureOrigin;

    /**
     * Extents of the content to write from `source` to `destination`.
     *
     * 写入尺寸。
     */
    size?: TextureSize

    /**
     * Defines which aspects of the texture to copy to/from.
     *
     * 写入纹理哪部分内容。
     *
     * @see GPUImageCopyTexture
     */
    aspect?: GPUTextureAspect;
}
