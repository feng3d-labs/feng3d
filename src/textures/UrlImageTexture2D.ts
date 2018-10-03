namespace feng3d
{
    export class UrlImageTexture2D extends Texture2D
    {
        __class__: "feng3d.UrlImageTexture2D" = "feng3d.UrlImageTexture2D";

        assetType = AssetExtension.texture;

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
         * 是否加载完成
         */
        get isLoaded()
        {
            if (this.url == "" || this.image) return true;
            return false;
        }

        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void)
        {
            if (this.isLoaded)
            {
                callback();
                return;
            }
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

        /**
         * 默认贴图
         */
        static default: UrlImageTexture2D;

        /**
         * 默认法线贴图
         */
        static defaultNormal: UrlImageTexture2D;

        /**
         * 默认粒子贴图
         */
        static defaultParticle: UrlImageTexture2D;
    }

    Feng3dAssets.setAssets(UrlImageTexture2D.default = new UrlImageTexture2D().value({ name: "Default-Texture", assetsId: "Default-Texture", hideFlags: HideFlags.NotEditable }));
    Feng3dAssets.setAssets(UrlImageTexture2D.defaultNormal = new UrlImageTexture2D().value({ name: "Default-NormalTexture", assetsId: "Default-NormalTexture", noPixels: ImageDatas.defaultNormal, hideFlags: HideFlags.NotEditable }));
    Feng3dAssets.setAssets(UrlImageTexture2D.defaultParticle = new UrlImageTexture2D().value({ name: "Default-ParticleTexture", assetsId: "Default-ParticleTexture", noPixels: ImageDatas.defaultParticle, hideFlags: HideFlags.NotEditable }));
}