namespace feng3d
{

    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    export class Texture2D extends TextureInfo
    {
        protected _pixels: HTMLImageElement;
        get url()
        {
            return this._pixels.src;
        }

        set url(value: string)
        {
            this._pixels.src = value;
        }

        constructor(url = "")
        {
            super();
            this._textureType = TextureType.TEXTURE_2D;
            this._pixels = new Image();
            this._pixels.crossOrigin = "Anonymous";
            this._pixels.addEventListener("load", this.onLoad.bind(this));
            this._pixels.src = url;
        }

        /**
         * 处理加载完成
         */
        protected onLoad()
        {
            this.invalidate();
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