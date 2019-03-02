namespace feng3d
{
    export class UrlImageTexture2D extends Texture2D
    {
        __class__: "feng3d.UrlImageTexture2D" = "feng3d.UrlImageTexture2D";

        assetType = AssetType.texture;

        @serialize
        @watch("urlChanged")
        @oav({ component: "OAVImage", priority: -1 })
        url = "";

        @watch("imageChanged")
        protected image: HTMLImageElement;

        constructor()
        {
            super();
            //
            feng3dDispatcher.on("asset.imageAssetChanged", this.onImageAssetChanged, this);
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

        protected saveFile(fs: ReadWriteFS, callback = (err: Error) => { })
        {
            fs.writeImage(this.url, this.image, callback);
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(fs: ReadFS, callback = (err: Error) => { })
        {
            fs.readImage(this.url, (err, img) =>
            {
                this.image = img;
                callback && callback(err);
            });
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
            if (pathUtils.isHttpURL(url))
            {
                loader.loadImage(url, (img) =>
                {
                    if (url == this.url)
                    {
                        this.image = img;
                        this.invalidate();
                        this.dispatch("loadCompleted");
                    }
                }, null,
                    (e) =>
                    {
                        if (url == this.url)
                        {
                            error(e);
                            this.image = null;
                            this.invalidate();
                            this.dispatch("loadCompleted");
                        }
                    });
            } else
            {
                fs.readImage(url, (err, img) =>
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

        }

        private onImageAssetChanged(e: Event<{ url: string; }>)
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

    rs.setDefaultAssetData(UrlImageTexture2D.default = Object.setValue(new UrlImageTexture2D(), { name: "Default-Texture", assetId: "Default-Texture", hideFlags: HideFlags.NotEditable }));
    rs.setDefaultAssetData(UrlImageTexture2D.defaultNormal = Object.setValue(new UrlImageTexture2D(), { name: "Default-NormalTexture", assetId: "Default-NormalTexture", noPixels: ImageDatas.defaultNormal, hideFlags: HideFlags.NotEditable }));
    rs.setDefaultAssetData(UrlImageTexture2D.defaultParticle = Object.setValue(new UrlImageTexture2D(), { name: "Default-ParticleTexture", assetId: "Default-ParticleTexture", noPixels: ImageDatas.defaultParticle, format: TextureFormat.RGBA, hideFlags: HideFlags.NotEditable }));
}