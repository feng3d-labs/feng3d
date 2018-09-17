namespace feng3d
{
    export class UrlImageTexture2D extends Texture2D
    {
        __class__: "feng3d.UrlImageTexture2D" = "feng3d.UrlImageTexture2D";

        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVImage" })
        url = "";

        @watch("imageChanged")
        private image: HTMLImageElement;

        constructor()
        {
            super();
            //
            feng3dDispatcher.on("assets.imageAssetsChanged", this.onImageAssetsChanged, this);
            this.urlChanged();
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
            assets.readFileAsImage(url, (err, img) =>
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