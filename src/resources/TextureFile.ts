namespace feng3d
{
    /**
     * 纹理文件
     */
    export class TextureFile extends Feng3dFile
    {
        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        texture = new UrlImageTexture2D();

        /**
         * 图片
         */
        get image()
        {
            return <HTMLImageElement>this.texture["_pixels"];
        }

        set image(v: HTMLImageElement)
        {
            this.texture["_pixels"] = v;
        }

        assetType = AssetExtension.texture;

        protected saveFile(readWriteAssets: ReadWriteAssetsFS, callback?: (err: Error) => void)
        {
            this.texture.assetsId = this.assetsId;
            this.texture.url = this.assetsPath;

            readWriteAssets.fs.writeImage(this.assetsPath, this.image, callback);
        }

        /**
         * 读取文件
         * @param readAssets 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(readAssets: ReadAssetsFS, callback?: (err: Error) => void)
        {
            readAssets.fs.readImage(this.assetsPath, (err, data: HTMLImageElement) =>
            {
                this.image = data;
                this.texture["_pixels"] = data;
                this.texture.assetsId = this.assetsId;
                this.texture.url = this.assetsPath;
                callback && callback(err);
            });
        }
    }

    Feng3dAssets.assetTypeClassMap[AssetExtension.texture] = TextureFile;
}