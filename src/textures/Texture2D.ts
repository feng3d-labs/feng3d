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
            this._pixels.src = value;
        }
        private _url = "";

        /**
         * 纹理尺寸
         */
        get size()
        {
            return new Point(this._pixels.width, this._pixels.height);
        }

        constructor(url = "")
        {
            super();
            this._textureType = TextureType.TEXTURE_2D;
            this._pixels = new Image();
            this._pixels.crossOrigin = "Anonymous";
            this._pixels.addEventListener("load", this.onLoad.bind(this));
            this._pixels.addEventListener("error", this.onLoad.bind(this));
            this.url = url;
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