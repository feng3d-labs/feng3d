import { Vector2 } from '@feng3d/math';
import { ImageUtil, Texture2D, WebGLContext } from '@feng3d/renderer';
import { $set } from '@feng3d/serialization';
import { AssetType } from '../assets/AssetType';
import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';

declare module '@feng3d/renderer'
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
    assetType = AssetType.texture;

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
