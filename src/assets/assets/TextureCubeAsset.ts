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
        data: TextureCube;

        extenson = ".json";

        assetType = AssetType.texturecube;

        protected saveFile(callback?: (err: Error) => void)
        {
            Object.setValue(this.data, { assetId: this.assetId });
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
        protected readFile(callback?: (err: Error) => void)
        {
            this.rs.fs.readObject(this.assetPath, (err, textureCube: TextureCube) =>
            {
                this.data = textureCube;
                Object.setValue(this.data, { assetId: this.assetId });
                callback && callback(err);
            });
        }
    }
}