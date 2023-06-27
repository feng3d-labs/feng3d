import { oav } from '@feng3d/objectview';
import { watcher } from '@feng3d/watcher';
import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { Vector2 } from '../math/geom/Vector2';
import { RegisterTexture } from '../renderer/data/Texture';
import { TextureTarget } from '../renderer/gl/WebGLEnums';
import { $set } from '../serialization/Serialization';
import { ImageUtil } from '../utils/ImageUtil';
import { TextureCube } from './TextureCube';

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
        return new Vector2(this.sources.TEXTURE_CUBE_MAP_POSITIVE_X['width'], this.sources.TEXTURE_CUBE_MAP_POSITIVE_X['height']);
    }
}

declare module '../core/AssetData'
{
    interface DefaultAssetDataMap
    {
        'Default-TextureCube': TextureCube;
    }
}

AssetData.addDefaultAssetData('Default-TextureCube', () => $set(new SourceTextureCube(), { name: 'Default-TextureCube', hideFlags: HideFlags.NotEditable }));
