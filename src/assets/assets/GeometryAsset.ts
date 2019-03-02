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

        saveFile(callback?: (err: Error) => void)
        {
            this.data.assetId = this.assetId;
            this.rs.fs.writeObject(this.assetPath, this.data, callback);
        }

        /**
         * 读取文件
         * 
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void)
        {
            this.rs.fs.readObject(this.assetPath, (err, data) =>
            {
                this.data = <any>data;
                this.data.assetId = this.assetId;
                callback && callback(err);
            });
        }
    }
}