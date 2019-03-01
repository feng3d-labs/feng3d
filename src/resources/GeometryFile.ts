namespace feng3d
{
    /**
     * 几何体资源文件
     */
    export class GeometryFile extends Feng3dFile
    {
        /**
         * 几何体
         */
        @oav({ component: "OAVObjectView" })
        geometry: Geometry;

        assetType = AssetExtension.geometry;

        extenson = ".json";

        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            this.geometry.assetsId = this.assetsId;
            fs.writeObject(this.assetsPath, this.geometry, callback);
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
                this.geometry = <any>data;
                this.geometry.assetsId = this.assetsId;
                callback && callback(err);
            });
        }
    }
}