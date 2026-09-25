import { TextureLike, TextureOrigin } from './Texture';

/**
 * 被操作的纹理相关信息。
 *
 * {@link GPUCommandEncoder.copyTextureToTexture}
 * {@link GPUImageCopyTexture}
 */
export interface ImageCopyTexture
{
    /**
     * Texture to copy to/from.
     */
    texture: TextureLike;

    /**
     * Mip-map level of the {@link GPUImageCopyTexture#texture} to copy to/from.
     */
    mipLevel?: number;

    /**
     * Defines the origin of the copy - the minimum corner of the texture sub-region to copy to/from.
     * Together with `copySize`, defines the full copy sub-region.
     */
    origin?: TextureOrigin;

    /**
     * Defines which aspects of the {@link GPUImageCopyTexture#texture} to copy to/from.
     */
    aspect?: TextureAspect;
}

export type TextureAspect = 'all' | 'stencil-only' | 'depth-only';
