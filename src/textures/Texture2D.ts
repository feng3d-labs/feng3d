module feng3d
{

    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    export class Texture2D extends TextureInfo
    {
        protected _pixels: HTMLImageElement;
        public get url()
        {
            return this._pixels.src;
        }

        public set url(value: string)
        {
            this._pixels.src = value;
        }

        constructor(url = "")
        {
            super();
            this.textureType = GL.TEXTURE_2D;
            this._pixels = new Image();
            this._pixels.crossOrigin = "Anonymous";
            // this._pixels.addEventListener("load", this.invalidate.bind(this));
            this._pixels.addEventListener("load", this.onLoad.bind(this));
            this._pixels.src = url;
            // Binding.bindProperty(this, ["url"], this._pixels, "src");
        }

        /**
         * 处理加载完成
         */
        protected onLoad()
        {
            this.invalidate();
            this.dispatchEvent(new Event(Event.LOADED, this));
        }

        /**
         * 判断数据是否满足渲染需求
         */
        public checkRenderData()
        {
            if (!this._pixels)
                return false;

            if (!this._pixels.width || !this._pixels.height)
                return false;

            return true;
        }
    }
}