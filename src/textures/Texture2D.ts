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
        protected _pixels: ImageData | HTMLImageElement;

        noPixels = imageDatas.white;

        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVPick", componentParam: { accepttype: "image" } })
        url = "";

        protected _textureType = TextureType.TEXTURE_2D;

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
            //
            feng3dDispatcher.on("assets.imageAssetsChanged", this.onImageAssetsChanged, this);
        }

        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData()
        {
            return !!this._pixels;
        }

        private urlChanged()
        {
            var url = this.url;
            assets.readFileAsImage(url, (err, img) =>
            {
                if (url == this.url)
                {
                    if (err)
                    {
                        // error(err);
                        this._pixels = null;
                    } else
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