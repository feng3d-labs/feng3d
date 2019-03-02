namespace feng3d
{
    /**
     * 纹理文件
     */
    export class TextureAsset extends FileAsset
    {
        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data = new Texture2D();

        extenson: ".jpg" | ".png" | ".jpeg" | ".gif" = ".png";

        /**
         * 图片
         */
        get image()
        {
            return <HTMLImageElement>this.data["_pixels"];
        }

        set image(v: HTMLImageElement)
        {
            this.data["_pixels"] = v;
        }

        assetType = AssetType.texture;

        protected saveFile(callback?: (err: Error) => void)
        {
            if (!(this.rs.fs instanceof ReadWriteFS)) return;
            this.data.assetId = this.assetId;
            this.rs.fs.writeImage(this.assetPath, this.image, (err) =>
            {
                callback && callback(err);
            });
        }

        /**
         * 读取文件
         * 
         * @param callback 完成回调
         */
        protected readFile(callback?: (err: Error) => void)
        {
            this.rs.fs.readImage(this.assetPath, (err, img: HTMLImageElement) =>
            {
                this.image = img;
                this.data.assetId = this.assetId;
                callback && callback(err);
            });
        }
    }
}