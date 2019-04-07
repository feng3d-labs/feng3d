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
        get data()
        {
            if (!this._texture2D)
            {
                this._texture2D = new Texture2D();
                this._texture2D.assetId = this.assetId;
            }
            return this._texture2D;
        }
        set data(v)
        {
            debuger && assert(!v.assetId, "初始资源不应该有资源编号");
            this._texture2D = v;
            this._texture2D.assetId = this.assetId;
        }
        private _texture2D: Texture2D;

        /**
         * 图片
         */
        get image() { return this._image; }

        set image(v: HTMLImageElement)
        {
            this._image = v;
            this.data["_pixels"] = v;
            this.saveFile();
        }
        private _image: HTMLImageElement;

        assetType = AssetType.texture;

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
                this._image = img;
                this.data["_pixels"] = img;
                callback && callback(err);
            });
        }

        /**
         * 读取元标签
         * 
         * @param callback 完成回调 
         */
        readMeta(callback?: (err?: Error) => void)
        {
            super.readMeta((err) =>
            {
                this._texture2D = this.meta["texture"];
                callback && callback(err);
            });
        }

        /**
         * 写元标签
         * 
         * @param callback 完成回调
         */
        writeMeta(callback?: (err: Error) => void)
        {
            this.meta["texture"] = this.data;
            this.rs.fs.writeObject(this.metaPath, this.meta, callback);
        }
    }
}