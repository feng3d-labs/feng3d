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

        assetType = AssetExtension.geometry;

        extenson = ".json";

        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            this.data.assetsId = this.assetsId;
            fs.writeObject(this.assetsPath, this.data, callback);
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(fs: ReadFS, callback?: (err: Error) => void)
        {
            fs.readObject(this.assetsPath, (err, data) =>
            {
                this.data = <any>data;
                this.data.assetsId = this.assetsId;
                callback && callback(err);
            });
        }
    }
}