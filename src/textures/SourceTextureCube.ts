import { Vector2 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { RegisterTexture, TextureTarget } from '@feng3d/renderer';
import { WebGLContext } from '@feng3d/renderer/src/WebGLContext';
import { ImageUtil } from '@feng3d/renderer/src/utils/ImageUtil';
import { $set } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { TextureCube } from './TextureCube';

declare module '@feng3d/renderer'
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

    setTextureData(webGLContext: WebGLContext): void
    {
        TextureCube.faces.forEach((face) =>
        {
            webGLContext.texImage2D(face, 0, this.format, this.format, this.type, this.sources[face] || ImageUtil.get('white'));
        });
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
