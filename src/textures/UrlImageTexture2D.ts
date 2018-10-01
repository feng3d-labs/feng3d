namespace feng3d
{
    export class UrlImageTexture2D extends Texture2D
    {
        __class__: "feng3d.UrlImageTexture2D" = "feng3d.UrlImageTexture2D";

        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVImage" })
        url = "";

        @oav()
        name: string;

        @watch("imageChanged")
        protected image: HTMLImageElement;

        constructor()
        {
            super();
            //
            feng3dDispatcher.on("assets.imageAssetsChanged", this.onImageAssetsChanged, this);
            this.urlChanged();
        }

        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void)
        {
            if (this.url == "" || this.image) callback();
            else this.once("loadCompleted", callback);
        }

        private imageChanged()
        {
            this._pixels = this.image;
            this.invalidate();
        }

        private urlChanged()
        {
            var url = this.url;
            if (url == "")
            {
                this.image = null;
                this.invalidate();
                return;
            }
            assets.readImage(url, (err, img) =>
            {
                if (url == this.url)
                {
                    if (err)
                    {
                        error(err);
                        this.image = null;
                    } else
                        this.image = img;
                    this.invalidate();
                    this.dispatch("loadCompleted");
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