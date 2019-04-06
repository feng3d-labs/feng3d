namespace feng3d
{
    export enum ImageDatas
    {
        black = "black",
        white = "white",
        red = "red",
        green = "green",
        blue = "blue",
        defaultNormal = "defaultNormal",
        defaultParticle = "defaultParticle",
    }

    export var imageDatas = {
        black: new ImageUtil(1, 1, Color4.fromUnit24(ColorKeywords.black)).imageData,
        white: new ImageUtil(1, 1, Color4.fromUnit24(ColorKeywords.white)).imageData,
        red: new ImageUtil(1, 1, Color4.fromUnit24(ColorKeywords.red)).imageData,
        green: new ImageUtil(1, 1, Color4.fromUnit24(ColorKeywords.green)).imageData,
        blue: new ImageUtil(1, 1, Color4.fromUnit24(ColorKeywords.blue)).imageData,
        defaultNormal: new ImageUtil(1, 1, Color4.fromUnit24(0x8080ff)).imageData,
        defaultParticle: new ImageUtil().drawDefaultParticle().imageData,
    }

    export interface Texture2DEventMap
    {
        /**
		 * 加载完成
		 */
        loadCompleted: any;
    }

    export interface Texture2D
    {
        once<K extends keyof Texture2DEventMap>(type: K, listener: (event: Event<Texture2DEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof Texture2DEventMap>(type: K, data?: Texture2DEventMap[K], bubbles?: boolean): Event<Texture2DEventMap[K]>;
        has<K extends keyof Texture2DEventMap>(type: K): boolean;
        on<K extends keyof Texture2DEventMap>(type: K, listener: (event: Event<Texture2DEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof Texture2DEventMap>(type?: K, listener?: (event: Event<Texture2DEventMap[K]>) => any, thisObject?: any);
    }

    /**
     * 2D纹理
     */
    export class Texture2D extends TextureInfo
    {
        __class__: "feng3d.Texture2D" = "feng3d.Texture2D";

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
            if (this.assetId)
            {
                // 来源于资源
                console.log(`来源于资源，不可修改！`)
                return;
            }

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
                    this._loadings.delete(v.url);
                    this.onItemLoadCompleted();
                }, null,
                    (e) =>
                    {
                        feng3d.error(e);
                        this._loadings.delete(v.url);
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
            if (this._loadings.length == 0) this.dispatch("loadCompleted");
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
         * 纹理类型
         */
        protected _textureType = TextureType.TEXTURE_2D;

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
    }

    rs.setDefaultAssetData(Texture2D.default = Object.setValue(new Texture2D(), { name: "Default-Texture", assetId: "Default-Texture", hideFlags: HideFlags.NotEditable }));
    rs.setDefaultAssetData(Texture2D.defaultNormal = Object.setValue(new Texture2D(), { name: "Default-NormalTexture", assetId: "Default-NormalTexture", noPixels: ImageDatas.defaultNormal, hideFlags: HideFlags.NotEditable }));
    rs.setDefaultAssetData(Texture2D.defaultParticle = Object.setValue(new Texture2D(), { name: "Default-ParticleTexture", assetId: "Default-ParticleTexture", noPixels: ImageDatas.defaultParticle, format: TextureFormat.RGBA, hideFlags: HideFlags.NotEditable }));
}