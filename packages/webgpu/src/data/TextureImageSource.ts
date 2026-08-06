import { ImageOrigin, ImageSize, TextureOrigin, TextureSize } from './Texture';

/**
 * 纹理的图片资源。
 *
 * @see GPUQueue.copyExternalImageToTexture
 */
export interface TextureImageSource
{
    /**
     * 数据类型。
     */
    readonly __type__?: 'TextureImageSource';

    /**
     * 图片资源。
     */
    image: TexImageSource;

    /**
     * 读取图片上的像素坐标。
     */
    imageOrigin?: ImageOrigin;

    /**
     * 写入纹理的mipmap层级索引。
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
     * 是否Y轴翻转图片。
     *
     * 默认 false。
     */
    flipY?: boolean;

    /**
     * 是否需要预乘透明度。
     */
    premultipliedAlpha?: boolean;

    /**
     * Defines which aspects of the texture to copy to/from.
     *
     * 写入纹理哪部分内容。
     *
     * @see GPUImageCopyTexture
     */
    aspect?: GPUTextureAspect;

    /**
     * Describes the color space and encoding used to encode data into the destination texture.
     *
     * This may result in values outside of the range [0, 1] being written to the target texture,
     * if its format can represent them. Otherwise, the results are clamped to the target
     * texture format's range.
     *
     * @see GPUImageCopyTextureTagged
     */
    colorSpace?: PredefinedColorSpace;
}

export class TextureImageSource
{
    /**
     * 获取纹理的图片资源尺寸。
     *
     * @param texImageSource 纹理的图片资源。
     * @returns
     */
    static getTexImageSourceSize(image: TexImageSource): ImageSize
    {
        let width: number;
        let height: number;

        if (image instanceof VideoFrame)
        {
            width = image.codedWidth;
            height = image.codedHeight;
        }
        else if (image instanceof HTMLVideoElement)
        {
            width = image.videoWidth;
            height = image.videoHeight;
        }
        else
        {
            width = image.width;
            height = image.height;
        }

        return [width, height];
    }
}
