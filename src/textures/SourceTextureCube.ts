import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { oav } from '../objectview/ObjectView';
import { RegisterTexture } from '../renderer/data/Texture';
import { TexImage2DTarget, TextureTarget } from '../renderer/gl/WebGLEnums';
import { $set } from '../serialization/Serialization';
import { ImageUtil } from '../utils/ImageUtil';
import { watcher } from '../watcher/watcher';
import { TextureCube } from './TextureCube';

export type TextureCubeImageName = 'positive_x_url' | 'positive_y_url' | 'positive_z_url' | 'negative_x_url' | 'negative_y_url' | 'negative_z_url';

declare module '../renderer/data/Texture'
{
    interface TextureMap extends TextureCubeMap { }
}

export interface TextureCubeMap
{
    SourceTextureCube: SourceTextureCube
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
@RegisterTexture('SourceTextureCube')
export class SourceTextureCube extends TextureCube
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

    sources: TextureCubeSources = {
        TEXTURE_CUBE_MAP_POSITIVE_X: ImageUtil.get('white'),
        TEXTURE_CUBE_MAP_POSITIVE_Y: ImageUtil.get('white'),
        TEXTURE_CUBE_MAP_POSITIVE_Z: ImageUtil.get('white'),
        TEXTURE_CUBE_MAP_NEGATIVE_X: ImageUtil.get('white'),
        TEXTURE_CUBE_MAP_NEGATIVE_Y: ImageUtil.get('white'),
        TEXTURE_CUBE_MAP_NEGATIVE_Z: ImageUtil.get('white'),
    };

    constructor()
    {
        super();
        watcher.watch(this as SourceTextureCube, 'sources', this.invalidate, this);
    }

    getSize()
    {
        return { x: this.sources.TEXTURE_CUBE_MAP_POSITIVE_X.width, y: this.sources.TEXTURE_CUBE_MAP_POSITIVE_X.height };
    }

    static default: TextureCube;
}

TextureCube.default = $set(new SourceTextureCube(), { name: 'Default-TextureCube', hideFlags: HideFlags.NotEditable });

AssetData.addAssetData('Default-TextureCube', TextureCube.default);
