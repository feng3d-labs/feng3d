import { AssetType } from '../assets/AssetType';
import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { Vector2 } from '../math/geom/Vector2';
import { TextureTarget } from '../renderer/gl/WebGLEnums';
import { $set } from '../serialization/Serialization';
import { ImageUtil } from '../utils/ImageUtil';
import { watcher } from '../watcher/watcher';
import { Texture2D } from './Texture2D';

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

    getSize()
    {
        return new Vector2(this.source.width, this.source.height);
    }
}

Texture2D.white = $set(new SourceTexture2D(), { name: 'white-Texture', source: ImageUtil.get('white'), hideFlags: HideFlags.NotEditable });
Texture2D.default = $set(new SourceTexture2D(), { name: 'Default-Texture', hideFlags: HideFlags.NotEditable });
Texture2D.defaultNormal = $set(new SourceTexture2D(), { name: 'Default-NormalTexture', source: ImageUtil.defaultNormal, hideFlags: HideFlags.NotEditable });
Texture2D.defaultParticle = $set(new SourceTexture2D(), { name: 'Default-ParticleTexture', source: ImageUtil.defaultParticle, format: 'RGBA', hideFlags: HideFlags.NotEditable });

AssetData.addAssetData('white-Texture', Texture2D.white);
AssetData.addAssetData('Default-Texture', Texture2D.default);
AssetData.addAssetData('Default-NormalTexture', Texture2D.defaultNormal);
AssetData.addAssetData('Default-ParticleTexture', Texture2D.defaultParticle);
