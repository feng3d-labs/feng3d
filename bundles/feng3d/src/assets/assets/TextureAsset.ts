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
        get data() { return this._data; }
        private _data = new Texture2D();

        get assetId() { return this._data.assetId; }
        set assetId(v) { debug.debuger && console.assert(this._data.assetId == undefined); this._data.assetId = v; }

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
        readMeta(callback?: (err?: Error) => void)
        {
            super.readMeta((err) =>
            {
                serialization.setValue(this.data, this.meta.texture);
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
            var texture = serialization.serialize(this.data);
            delete texture[CLASS_KEY];

            this.meta.texture = texture;
            this.rs.fs.writeObject(this.metaPath, this.meta, callback);
        }
    }

    export interface TextureAssetMeta extends AssetMeta
    {
        texture: gPartial<Texture2D>;
    }
}