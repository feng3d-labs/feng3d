import { TextureLike } from './Texture';

/**
 * 纹理视图。
 *
 * @see GPUTextureView
 * @see GPUTexture.createView
 * @see GPUTextureViewDescriptor
 */
export interface TextureView
{
    /**
     * 标签。
     *
     * 用于调试。
     *
     * 注：修改后将重新创建视图。
     */
    readonly label?: string;

    /**
     * 产生视图的纹理。
     *
     * 注：修改后将重新创建视图。
     */
    readonly texture: TextureLike;

    /**
     * mipmap级别。
     *
     * 默认为 0。
     *
     * 注：修改后将重新创建视图。
     */
    readonly baseMipLevel?: number;

    /**
     * 3d纹理的深度索引、纹理数组中的层次、立方体纹理的面索引。
     *
     * 默认为 0。
     *
     * 注：修改后将重新创建视图。
     */
    readonly baseArrayLayer?: number;

    /**
     * 数组层数。
     *
     * 默认为 1。
     *
     * 被用作颜色附件时，必须为 1。而其他情况默认为 undefined（使用所有剩余层）。
     *
     * 注：修改后将重新创建视图。
     */
    readonly arrayLayerCount?: number;

    /**
     * 是否被用作颜色附件。
     *
     * 注：由 WebGPU 渲染通道颜色附件自动设置。
     */
    readonly isUsedAsColorAttachment?: boolean;

    /**
     * The format of the texture view. Must be either the {@link GPUTextureDescriptor#format} of the
     * texture or one of the {@link GPUTextureDescriptor#viewFormats} specified during its creation.
     *
     * 注：修改后将重新创建视图。
     */
    readonly format?: GPUTextureFormat;

    /**
     * The dimension to view the texture as.
     *
     * 注：修改后将重新创建视图。
     */
    readonly dimension?: GPUTextureViewDimension;

    /**
     * The allowed {@link GPUTextureUsage|usage(s)} for the texture view. Must be a subset of the
     * {@link GPUTexture#usage} flags of the texture. If 0, defaults to the full set of
     * {@link GPUTexture#usage} flags of the texture.
     * Note: If the view's {@link GPUTextureViewDescriptor#format} doesn't support all of the
     * texture's {@link GPUTextureDescriptor#usage}s, the default will fail,
     * and the view's {@link GPUTextureViewDescriptor#usage} must be specified explicitly.
     *
     * 注：修改后将重新创建视图。
     */
    readonly usage?: GPUTextureUsageFlags;

    /**
     * Which {@link GPUTextureAspect|aspect(s)} of the texture are accessible to the texture view.
     *
     * 注：修改后将重新创建视图。
     */
    readonly aspect?: GPUTextureAspect;

    /**
     * How many mipmap levels, starting with {@link GPUTextureViewDescriptor#baseMipLevel}, are accessible to
     * the texture view.
     *
     * 注：修改后将重新创建视图。
     */
    readonly mipLevelCount?: GPUIntegerCoordinate;
}
