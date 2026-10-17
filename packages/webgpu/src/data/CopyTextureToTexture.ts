import { ImageCopyTexture } from './ImageCopyTexture';
import { TextureSize } from './Texture';

/**
 * GPU纹理间拷贝。
 *
 * {@link GPUCommandEncoder.copyTextureToTexture}
 */
export interface CopyTextureToTexture
{
    /**
     * 数据类型。
     */
    readonly __type__: 'CopyTextureToTexture';

    /**
     * Combined with `copySize`, defines the region of the source texture subresources.
     */
    readonly source: ImageCopyTexture;

    /**
     * Combined with `copySize`, defines the region of the destination texture subresources.
     */
    readonly destination: ImageCopyTexture;

    /**
     * 拷贝的尺寸。
     */
    readonly copySize: TextureSize;
}
