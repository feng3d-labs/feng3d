namespace feng3d
{
    /**
     * 对象资源
     */
    export abstract class ObjectAsset extends FileAsset
    {
        /**
         * 资源对象
         */
        @oav({ component: "OAVObjectView" })
        data: AssetData;

        saveFile(callback?: (err: Error) => void)
        {
            this.data.assetId = this.assetId;
            this.rs.fs.writeObject(this.assetPath, this.data, (err) =>
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
            this.rs.fs.readObject(this.assetPath, (err, data: AssetData) =>
            {
                this.data = data;
                this.data.assetId = this.assetId;
                callback && callback(err);
            });
        }
    }
}