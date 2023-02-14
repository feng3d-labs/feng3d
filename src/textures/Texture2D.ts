import { AssetType } from '../assets/AssetType';
import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { ColorKeywords } from '../math/Color3';
import { Color4 } from '../math/Color4';
import { RegisterTexture } from '../renderer/data/Texture';
import { TextureTarget } from '../renderer/gl/WebGLEnums';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { $set } from '../serialization/Serialization';
import { ImageUtil } from '../utils/ImageUtil';
import { watcher } from '../watcher/watcher';
import { TextureInfo } from './TextureInfo';

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

export interface Texture2DEventMap
{
    /**
     * 加载完成
     */
    loadCompleted: any;
}

declare module '../renderer/data/Texture'
{
    interface TextureMap extends Texture2DMap { }
}

export interface Texture2DMap
{
    Texture2D: Texture2D;
}

export type Texture2DLike = Texture2DMap[keyof Texture2DMap];

/**
 * 2D纹理
 */
@RegisterTexture('Texture2D')
export class Texture2D extends TextureInfo
{
    /**
     * 纹理类型
     */
    textureTarget: TextureTarget = 'TEXTURE_2D';

    /**
     * One of the following objects can be used as a pixel source for the texture.
     */
    source: TexImageSource;

    assetType = AssetType.texture;

    /**
     * 当贴图数据未加载好等情况时代替使用
     */
    noPixels = ImageDatas.white;

    constructor(param?: Partial<Texture2D>)
    {
        super();
        Object.assign(this, param);

        watcher.watch(this as Texture2D, 'source', this.invalidate, this);
    }

    /**
     * 默认贴图
     */
    static white: Texture2D;

    /**
     * 默认贴图
     */
    static default: Texture2D;

    /**
     * 默认法线贴图
     */
    static defaultNormal: Texture2D;

    /**
     * 默认粒子贴图
     */
    static defaultParticle: Texture2D;

    setTextureData(webGLRenderer: WebGLRenderer)
    {
        const data = this;
        const level = 0;

        webGLRenderer.webGLContext.texImage2D('TEXTURE_2D', level, data.format, data.format, data.type, data.source);
    }
}

Texture2D.white = $set(new Texture2D(), { name: 'white-Texture', noPixels: ImageDatas.white, hideFlags: HideFlags.NotEditable });
Texture2D.default = $set(new Texture2D(), { name: 'Default-Texture', hideFlags: HideFlags.NotEditable });
Texture2D.defaultNormal = $set(new Texture2D(), { name: 'Default-NormalTexture', noPixels: ImageDatas.defaultNormal, hideFlags: HideFlags.NotEditable });
Texture2D.defaultParticle = $set(new Texture2D(), { name: 'Default-ParticleTexture', noPixels: ImageDatas.defaultParticle, format: 'RGBA', hideFlags: HideFlags.NotEditable });

AssetData.addAssetData('white-Texture', Texture2D.white);
AssetData.addAssetData('Default-Texture', Texture2D.default);
AssetData.addAssetData('Default-NormalTexture', Texture2D.defaultNormal);
AssetData.addAssetData('Default-ParticleTexture', Texture2D.defaultParticle);
