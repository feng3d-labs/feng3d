namespace feng3d
{
    /**
     * 纹理文件
     */
    export class TextureAsset extends FileAsset
    {
        static extenson: ".jpg" | ".png" | ".jpeg" | ".gif" = ".png";

        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data: Texture2D;

        /**
         * 图片
         */
        get image() { return <any>this.data["_pixels"]; }
        set image(v: HTMLImageElement)
        {
            this.data["_pixels"] = v;
            this.saveFile();
        }

        meta: TextureAssetMeta;

        assetType = AssetType.texture;

        createData()
        {
            this.data = new Texture2D();
            this.data.assetId = this.assetId;
        }

        saveFile(callback?: (err: Error) => void)
        {
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
        readFile(callback?: (err: Error) => void)
        {
            this.rs.fs.readImage(this.assetPath, (err, img: HTMLImageElement) =>
            {
                this.data["_pixels"] = img;
                callback && callback(err);
            });
        }

        /**
         * 读取元标签
         * 
         * @param callback 完成回调 
         */
        protected readMeta(callback?: (err?: Error) => void)
        {
            super.readMeta((err) =>
            {
                this.rs.deserializeWithAssets(this.meta.texture, (result) =>
                {
                    this.data = result;
                    callback && callback(err);
                });
            });
        }

        /**
         * 写元标签
         * 
         * @param callback 完成回调
         */
        protected writeMeta(callback?: (err: Error) => void)
        {
            this.meta.texture = serialization.serialize(this.data);
            super.writeMeta(callback);
        }
    }

    export interface TextureAssetMeta extends AssetMeta
    {
        texture: gPartial<Texture2D>;
    }
}