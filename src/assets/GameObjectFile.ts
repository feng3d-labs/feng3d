namespace feng3d
{
    /**
     * 游戏对象文件
     */
    export class GameObjectFile extends Feng3dFile
    {
        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data = new GameObject();

        assetType = AssetExtension.gameobject;

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