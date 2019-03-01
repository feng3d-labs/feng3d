namespace feng3d
{
    /**
     * 材质资源
     */
    export class MaterialAsset extends FileAsset
    {
        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data = new Material();

        assetType = AssetExtension.material;

        extenson = ".json";

        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            this.data.assetId = this.assetId;
            fs.writeObject(this.assetPath, this.data, callback);
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(fs: ReadFS, callback?: (err: Error) => void)
        {
            fs.readObject(this.assetPath, (err, data: Material) =>
            {
                this.data = data;
                this.data.assetId = this.assetId;
                callback && callback(err);
            });
        }
    }
}