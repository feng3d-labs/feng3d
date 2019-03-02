namespace feng3d
{
    /**
     * 几何体资源
     */
    export class GeometryAsset extends FileAsset
    {
        /**
         * 几何体
         */
        @oav({ component: "OAVObjectView" })
        data: Geometry;

        assetType = AssetType.geometry;

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
            fs.readObject(this.assetPath, (err, data) =>
            {
                this.data = <any>data;
                this.data.assetId = this.assetId;
                callback && callback(err);
            });
        }
    }
}