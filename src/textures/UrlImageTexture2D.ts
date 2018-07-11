namespace feng3d
{
    export class UrlImageTexture2D extends ImageTexture2D
    {
        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVPick", componentParam: { accepttype: "image" } })
        url = "";

        constructor(raw?: gPartial<UrlImageTexture2D>)
        {
            super(raw);
            //
            feng3dDispatcher.on("assets.imageAssetsChanged", this.onImageAssetsChanged, this);
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