namespace feng3d
{
    export var imageDatas = {
        black: imageUtil.createImageData(1, 1, ColorKeywords.black),
        white: imageUtil.createImageData(1, 1, ColorKeywords.white),
        red: imageUtil.createImageData(1, 1, ColorKeywords.red),
        green: imageUtil.createImageData(1, 1, ColorKeywords.green),
        blue: imageUtil.createImageData(1, 1, ColorKeywords.blue),
        defaultNormal: imageUtil.createImageData(1, 1, 0x8080ff),
    }

    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    export class Texture2D extends TextureInfo
    {
        protected _pixels: HTMLImageElement;

        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVPick", componentParam: { accepttype: "image" } })
        url = "";

        /**
         * 纹理尺寸
         */
        get size()
        {
            if (!this._pixels) new Vector2(1, 1);
            return new Vector2(this._pixels.width, this._pixels.height);
        }

        constructor(raw?: gPartial<Texture2D>)
        {
            super(raw);
            this._textureType = TextureType.TEXTURE_2D;
            this.noPixels = this.noPixels || imageDatas.white;
            feng3dDispatcher.on("assets.imageAssetsChanged", this.onImageAssetsChanged, this);
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

        private urlChanged()
        {
            var url = this.url;
            assets.readFileAsImage(url, (err, img) =>
            {
                if (url == this.url)
                {
                    this._pixels = img;
                    this.invalidate();
                }
            });
        }

        private onImageAssetsChanged(e: Event<{ url: string; }>)
        {
            if (this.url == e.data.url)
                this.urlChanged();
        }
    }
}