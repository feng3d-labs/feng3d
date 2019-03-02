namespace feng3d
{
    /**
     * 游戏对象资源
     */
    export class GameObjectAsset extends FileAsset
    {
        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data = new GameObject();

        assetType = AssetType.gameobject;

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