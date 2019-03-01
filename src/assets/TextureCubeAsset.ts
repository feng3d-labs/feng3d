namespace feng3d
{
    /**
     * 立方体纹理资源
     */
    export class TextureCubeAsset extends FileAsset
    {
        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data = new TextureCube();

        extenson = ".json";

        assetType = AssetExtension.texturecube;

        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            this.data.assetsId = this.assetsId;

            fs.writeObject(this.assetsPath, this.data, (err) =>
            {
                callback && callback(err);
            });
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(fs: ReadFS, callback?: (err: Error) => void)
        {
            fs.readObject(this.assetsPath, (err, textureCube: TextureCube) =>
            {
                this.data = textureCube;
                this.data.assetsId = this.assetsId;
                callback && callback(err);
            });
        }
    }
}