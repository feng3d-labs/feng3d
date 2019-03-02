namespace feng3d
{
    /**
     * 文件夹资源
     */
    export class FolderAsset extends FileAsset
    {
        assetType = AssetType.folder;

        /**
         * 子资源列表
         */
        @serialize
        childrenAssets: FileAsset[] = [];

        extenson = "";

        /**
         * 保存文件
         * @param callback 完成回调
         */
        protected saveFile(callback?: (err: Error) => void)
        {
            if (!(this.rs.fs instanceof ReadWriteFS)) return;

            this.rs.fs.mkdir(this.assetPath, callback);
        }
    }
}