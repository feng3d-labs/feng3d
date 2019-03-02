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