import { loader } from "@feng3d/filesystem";
import { TextureFormat, TextureType } from "@feng3d/renderer";
import { serialization, serialize } from "@feng3d/serialization";
import { AssetType } from "../assets/AssetType";
import { AssetData } from "../core/AssetData";
import { HideFlags } from "../core/HideFlags";
import { ImageDatas, TextureInfo } from "../render/data/TextureInfo";

export interface Texture2DEventMap
{
    /**
     * 加载完成
     */
    loadCompleted: any;
}

/**
 * 2D纹理
 */
export class Texture2D<T extends Texture2DEventMap = Texture2DEventMap> extends TextureInfo<T>
{
    __class__: "feng3d.Texture2D";

    /**
     * 纹理类型
     */
    textureType = TextureType.TEXTURE_2D;

    assetType = AssetType.texture;

    /**
     * 当贴图数据未加载好等情况时代替使用
     */
    noPixels = ImageDatas.white;

    /**
     * 是否已加载
     */
    get isLoaded() { return this._loadings.length == 0; }
    private _loadings = [];

    get image(): HTMLImageElement
    {
        return <any>this._pixels;
    }

    /**
     * 用于表示初始化纹理的数据来源
     */
    @serialize
    get source()
    {
        return this._source;
    }
    set source(v)
    {
        this._source = v;
        if (!v)
        {
            this._pixels = null;
            this.invalidate();
            return;
        }
        if (v.url)
        {
            this._loadings.push(v.url);
            loader.loadImage(v.url, (img) =>
            {
                this._pixels = img;
                this.invalidate();
                Array.delete(this._loadings, v.url);
                this.onItemLoadCompleted();
            }, null,
                (e) =>
                {
                    console.error(e);
                    Array.delete(this._loadings, v.url);
                    this.onItemLoadCompleted();
                });
        }
    }

    constructor()
    {
        super();
    }

    private onItemLoadCompleted()
    {
        if (this._loadings.length == 0) this.emit("loadCompleted");
    }

    /**
     * 已加载完成或者加载完成时立即调用
     * @param callback 完成回调
     */
    onLoadCompleted(callback: () => void)
    {
        if (this.isLoaded) { callback(); return; }
        this.once("loadCompleted", callback);
    }

    private _source: { url: string };

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

    /**
     * 从url初始化纹理
     * 
     * @param url 路径
     */
    static fromUrl(url: string)
    {
        var texture = new Texture2D();
        texture.source = { url: url };
        return texture;
    }
}

Texture2D.white = serialization.setValue(new Texture2D(), { name: "white-Texture", noPixels: ImageDatas.white, hideFlags: HideFlags.NotEditable })
Texture2D.default = serialization.setValue(new Texture2D(), { name: "Default-Texture", hideFlags: HideFlags.NotEditable })
Texture2D.defaultNormal = serialization.setValue(new Texture2D(), { name: "Default-NormalTexture", noPixels: ImageDatas.defaultNormal, hideFlags: HideFlags.NotEditable })
Texture2D.defaultParticle = serialization.setValue(new Texture2D(), { name: "Default-ParticleTexture", noPixels: ImageDatas.defaultParticle, format: TextureFormat.RGBA, hideFlags: HideFlags.NotEditable })

AssetData.addAssetData("white-Texture", Texture2D.white);
AssetData.addAssetData("Default-Texture", Texture2D.default);
AssetData.addAssetData("Default-NormalTexture", Texture2D.defaultNormal);
AssetData.addAssetData("Default-ParticleTexture", Texture2D.defaultParticle);
