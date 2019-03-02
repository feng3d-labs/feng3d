namespace feng3d
{
    /**
     * 文件夹资源
     */
    export class FolderAsset extends FileAsset
    {
        assetType = AssetType.folder;

        extenson = "";

        /**
         * 子资源列表
         */
        @serialize
        childrenAssets: FileAsset[] = [];

        /**
         * 保存文件
         * @param callback 完成回调
         */
        protected saveFile(callback?: (err: Error) => void)
        {
            this.rs.fs.mkdir(this.assetPath, callback);
        }

        /**
         * 读取文件
         * @param callback 完成回调
         */
        protected readFile(callback?: (err: Error) => void)
        {
            callback && callback(null);
        }
    }
}