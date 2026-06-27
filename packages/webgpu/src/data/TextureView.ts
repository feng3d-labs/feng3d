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

/**
 * TextureView 命名空间 - 提供纹理视图相关工具方法
 */
export namespace TextureView
{
    /**
     * 创建纹理视图
     *
     * @param texture 纹理
     * @param options 视图选项
     */
    export function create(texture: TextureLike, options?: {
        label?: string;
        format?: GPUTextureFormat;
        dimension?: GPUTextureViewDimension;
        baseMipLevel?: number;
        mipLevelCount?: number;
        baseArrayLayer?: number;
        arrayLayerCount?: number;
        aspect?: GPUTextureAspect;
        usage?: GPUTextureUsageFlags;
    }): TextureView
    {
        return {
            texture,
            label: options?.label,
            format: options?.format,
            dimension: options?.dimension,
            baseMipLevel: options?.baseMipLevel || 0,
            mipLevelCount: options?.mipLevelCount,
            baseArrayLayer: options?.baseArrayLayer || 0,
            arrayLayerCount: options?.arrayLayerCount,
            aspect: options?.aspect || 'all',
            usage: options?.usage,
        };
    }

    /**
     * 创建 2D 纹理视图
     */
    export function create2D(texture: TextureLike, label?: string): TextureView
    {
        return create(texture, { label, dimension: '2d' });
    }

    /**
     * 创建立方体纹理视图
     */
    export function createCube(texture: TextureLike, label?: string): TextureView
    {
        return create(texture, { label, dimension: 'cube', arrayLayerCount: 6 });
    }

    /**
     * 创建 2D 数组纹理视图
     */
    export function create2DArray(texture: TextureLike, arrayLayerCount: number, label?: string): TextureView
    {
        return create(texture, { label, dimension: '2d-array', arrayLayerCount });
    }

    /**
     * 创建深度纹理视图
     */
    export function createDepth(texture: TextureLike, label?: string): TextureView
    {
        return create(texture, { label, aspect: 'depth-only' });
    }

    /**
     * 创建模板纹理视图
     */
    export function createStencil(texture: TextureLike, label?: string): TextureView
    {
        return create(texture, { label, aspect: 'stencil-only' });
    }
}
