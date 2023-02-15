import { AssetType } from '../assets/AssetType';
import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { ColorKeywords } from '../math/Color3';
import { Color4 } from '../math/Color4';
import { RegisterTexture } from '../renderer/data/Texture';
import { TextureTarget } from '../renderer/gl/WebGLEnums';
import { $set } from '../serialization/Serialization';
import { ImageUtil } from '../utils/ImageUtil';
import { watcher } from '../watcher/watcher';
import { Texture2D } from './Texture2D';

export enum ImageDatas
{
    black = 'black',
    white = 'white',
    red = 'red',
    green = 'green',
    blue = 'blue',
    defaultNormal = 'defaultNormal',
    defaultParticle = 'defaultParticle',
}

export let imageDatas: {
    black: ImageData;
    white: ImageData;
    red: ImageData;
    green: ImageData;
    blue: ImageData;
    defaultNormal: ImageData;
    defaultParticle: ImageData;
};
if (typeof document !== 'undefined')
{
    imageDatas = {
        black: new ImageUtil(1, 1, new Color4().fromUnit24(ColorKeywords.black)).imageData,
        white: new ImageUtil(1, 1, new Color4().fromUnit24(ColorKeywords.white)).imageData,
        red: new ImageUtil(1, 1, new Color4().fromUnit24(ColorKeywords.red)).imageData,
        green: new ImageUtil(1, 1, new Color4().fromUnit24(ColorKeywords.green)).imageData,
        blue: new ImageUtil(1, 1, new Color4().fromUnit24(ColorKeywords.blue)).imageData,
        defaultNormal: new ImageUtil(1, 1, new Color4().fromUnit24(0x8080ff)).imageData,
        defaultParticle: new ImageUtil().drawDefaultParticle().imageData,
    };
}

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

    constructor(param?: Partial<SourceTexture2D>)
    {
        super(param);

        watcher.watch(this as SourceTexture2D, 'source', this.invalidate, this);
    }

    getSize()
    {
        return { x: this.source.width, y: this.source.height };
    }
}

Texture2D.white = $set(new SourceTexture2D(), { name: 'white-Texture', source: ImageDatas.white, hideFlags: HideFlags.NotEditable });
Texture2D.default = $set(new SourceTexture2D(), { name: 'Default-Texture', hideFlags: HideFlags.NotEditable });
Texture2D.defaultNormal = $set(new SourceTexture2D(), { name: 'Default-NormalTexture', source: ImageDatas.defaultNormal, hideFlags: HideFlags.NotEditable });
Texture2D.defaultParticle = $set(new SourceTexture2D(), { name: 'Default-ParticleTexture', source: ImageDatas.defaultParticle, format: 'RGBA', hideFlags: HideFlags.NotEditable });

AssetData.addAssetData('white-Texture', Texture2D.white);
AssetData.addAssetData('Default-Texture', Texture2D.default);
AssetData.addAssetData('Default-NormalTexture', Texture2D.defaultNormal);
AssetData.addAssetData('Default-ParticleTexture', Texture2D.defaultParticle);
