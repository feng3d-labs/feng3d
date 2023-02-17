import { oav } from '../objectview/ObjectView';
import { Texture } from '../renderer/data/Texture';
import { TexImage2DTarget, TextureTarget } from '../renderer/gl/WebGLEnums';

export type TextureCubeImageName = 'positive_x_url' | 'positive_y_url' | 'positive_z_url' | 'negative_x_url' | 'negative_y_url' | 'negative_z_url';

declare module '../renderer/data/Texture'
{
    interface TextureMap extends TextureCubeMap { }
}

export interface TextureCubeMap { }

declare module '../renderer/data/Uniforms'
{
    interface UniformTypeMap
    {
        TextureCube: TextureCube;
    }
}

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

    static default: TextureCube;
}
