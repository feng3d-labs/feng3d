import { Vector2 } from '@feng3d/math';
import { WebGLContext } from '@feng3d/renderer/src/WebGLContext';
import { Texture2D } from '@feng3d/renderer/src/textures/Texture2D';
import { ImageUtil } from '@feng3d/renderer/src/utils/ImageUtil';
import { $set } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { AssetType } from '../assets/AssetType';
import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { Texture } from '../renderer/data/Texture';
import { TextureTarget } from '../renderer/gl/WebGLEnums';

declare module '../renderer/data/Texture'
{
    interface TextureMap extends Texture2DMap { }
}

export interface Texture2DMap
{
    SourceTexture2D: SourceTexture2D;
}

export type Texture2DLike = Texture2DMap[keyof Texture2DMap];

/**
 * 提供数据源的2D纹理
 */
export class SourceTexture2D extends Texture2D
{
    textureTarget: TextureTarget = 'TEXTURE_2D';

    /**
     * One of the following objects can be used as a pixel source for the texture.
     */
    source: TexImageSource;

    assetType = AssetType.texture;

    constructor()
    {
        super();
        watcher.watch(this as SourceTexture2D, 'source', this.invalidate, this);
    }

    setTextureData(webGLContext: WebGLContext)
    {
        webGLContext.texImage2D('TEXTURE_2D', 0, this.format, this.format, this.type, this.source || ImageUtil.get('white'));
    }

    getSize()
    {
        return new Vector2(this.source['width'], this.source['height']);
    }
}

declare module '../core/AssetData'
{
    interface DefaultAssetDataMap
    {
        'white-Texture': Texture2D;
        'Default-Texture': Texture2D;
        'Default-NormalTexture': Texture2D;
        'Default-ParticleTexture': Texture2D;
    }
}

AssetData.addDefaultAssetData('white-Texture', () => $set(new SourceTexture2D(), { name: 'white-Texture', source: ImageUtil.get('white'), hideFlags: HideFlags.NotEditable }));
AssetData.addAssetData('Default-Texture', () => $set(new SourceTexture2D(), { name: 'Default-Texture', hideFlags: HideFlags.NotEditable }));
AssetData.addAssetData('Default-NormalTexture', () => $set(new SourceTexture2D(), { name: 'Default-NormalTexture', source: ImageUtil.defaultNormal, hideFlags: HideFlags.NotEditable }));
AssetData.addAssetData('Default-ParticleTexture', () => $set(new SourceTexture2D(), { name: 'Default-ParticleTexture', source: ImageUtil.defaultParticle, format: 'RGBA', hideFlags: HideFlags.NotEditable }));
