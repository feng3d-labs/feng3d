import { oav } from '@feng3d/objectview';
import { TexImage2DTarget, Texture, TextureTarget } from '@feng3d/renderer';

declare module '@feng3d/renderer'
{
    interface TextureMap extends TextureCubeMap { }

    interface UniformTypeMap
    {
        TextureCube: TextureCube;
    }
}

export interface TextureCubeMap { }

/**
 * 立方体纹理贴图
 */
export type TextureCubeSources = {
    TEXTURE_CUBE_MAP_POSITIVE_X: TexImageSource,
    TEXTURE_CUBE_MAP_POSITIVE_Y: TexImageSource,
    TEXTURE_CUBE_MAP_POSITIVE_Z: TexImageSource,
    TEXTURE_CUBE_MAP_NEGATIVE_X: TexImageSource,
    TEXTURE_CUBE_MAP_NEGATIVE_Y: TexImageSource,
    TEXTURE_CUBE_MAP_NEGATIVE_Z: TexImageSource,
};

/**
 * 立方体纹理
 */
export abstract class TextureCube extends Texture
{
    textureTarget: TextureTarget = 'TEXTURE_CUBE_MAP';

    /**
     * 立方体六个面。
     */
    static faces: TexImage2DTarget[] = [
        'TEXTURE_CUBE_MAP_POSITIVE_X', 'TEXTURE_CUBE_MAP_POSITIVE_Y', 'TEXTURE_CUBE_MAP_POSITIVE_Z',
        'TEXTURE_CUBE_MAP_NEGATIVE_X', 'TEXTURE_CUBE_MAP_NEGATIVE_Y', 'TEXTURE_CUBE_MAP_NEGATIVE_Z'
    ];

    @oav({ component: 'OAVCubeMap', priority: 1 })
    OAVCubeMap = '';

    constructor()
    {
        super();
    }
}
