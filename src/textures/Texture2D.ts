namespace feng3d
{

    export interface Texture2DVO
    {
        url: string;
    }

    export interface Texture2DEventMap
    {
        /**
         * 纹理加载完成
         */
        loaded;
    }

    export interface Texture2D
    {
        once<K extends keyof Texture2DEventMap>(type: K, listener: (event: Event<Texture2DEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof Texture2DEventMap>(type: K, data?: Texture2DEventMap[K], bubbles?: boolean);
        has<K extends keyof Texture2DEventMap>(type: K): boolean;
        on<K extends keyof Texture2DEventMap>(type: K, listener: (event: Event<Texture2DEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof Texture2DEventMap>(type?: K, listener?: (event: Event<Texture2DEventMap[K]>) => any, thisObject?: any);
    }

    export var imageDatas = {
        black: ImageUtil.createImageData(1, 1, ColorKeywords.black),
        white: ImageUtil.createImageData(1, 1, ColorKeywords.white),
        red: ImageUtil.createImageData(1, 1, ColorKeywords.red),
        green: ImageUtil.createImageData(1, 1, ColorKeywords.green),
        blue: ImageUtil.createImageData(1, 1, ColorKeywords.blue),
        defaultNormal: ImageUtil.createImageData(1, 1, 0x8080ff),
    }

    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    export class Texture2D extends TextureInfo
    {
        protected _pixels: HTMLImageElement;

        @serialize("")
        @oav()
        get url()
        {
            return this._url;
        }

        set url(value: string)
        {
            if (this._url == value)
                return;
            this._url = value;

            var url = this._url;
            assets.loadImage(url, (img) =>
            {
                if (url == this._url)
                {
                    this._pixels = img;
                    this.onLoad();
                }
            });
        }
        private _url = "";

        // noPixels = imageDatas.white;
        // noPixels = imageDatas.black;
        // noPixels = imageDatas.defaultNormal;

        /**
         * 纹理尺寸
         */
        get size()
        {
            if (!this._pixels) new Vector2(1, 1);
            return new Vector2(this._pixels.width, this._pixels.height);
        }

        constructor(url = "")
        {
            super();
            this._textureType = TextureType.TEXTURE_2D;
            this.url = url;
            this.noPixels = imageDatas.white;
        }

        /**
         * 处理加载完成
         */
        protected onLoad()
        {
            this.invalidate();
            this.dispatch("loaded");
        }

        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData()
        {
            if (!this._pixels)
                return false;

            if (!this._pixels.width || !this._pixels.height)
                return false;

            return true;
        }
    }
}