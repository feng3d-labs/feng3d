import { Vector2 } from '../../math/geom/Vector2';
import { oav } from '../../objectview/ObjectView';
import { ImageUtil } from '../../renderer/utils/ImageUtil';
import { RegisterTexture, TextureTarget, WebGLContext } from '../../renderer/data/Texture';
import { $set } from '../../serialization/Serialization';
import { watcher } from '../../watcher/watcher';
import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { TextureCube, TextureCubeSources } from './TextureCube';

declare module './TextureCube'
{
    interface TextureCubeMap
    {
        SourceTextureCube: SourceTextureCube
    }
}

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
