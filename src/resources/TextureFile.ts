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
        texture = new Texture2D();

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

        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            this.texture.assetsId = this.assetsId;

            fs.writeImage(this.assetsPath, this.image, (err) =>
            {
                callback && callback(err);
            });
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(fs: ReadFS, callback?: (err: Error) => void)
        {
            fs.readImage(this.assetsPath, (err, img: HTMLImageElement) =>
            {
                this.image = img;
                this.texture.assetsId = this.assetsId;
                callback && callback(err);
            });
        }
    }

    Feng3dAssets.assetTypeClassMap[AssetExtension.texture] = TextureFile;
}