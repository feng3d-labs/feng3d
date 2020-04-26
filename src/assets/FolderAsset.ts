namespace feng3d
{
    /**
     * 文件夹资源
     */
    @ov({ component: "OVFolderAsset" })
    export class FolderAsset extends FileAsset
    {
        static extenson = "";

        assetType = AssetType.folder;

        /**
         * 子资源列表
         */
        @serialize
        childrenAssets: FileAsset[] = [];

        initAsset()
        {
        }

        /**
         * 删除资源
         * 
         * @param callback 完成回调
         */
        delete(callback?: (err: Error) => void)
        {
            super.delete(callback);
        }

        /**
         * 保存文件
         * @param callback 完成回调
         */
        saveFile(callback?: (err: Error) => void)
        {
            this.rs.fs.mkdir(this.assetPath, callback);
        }

        /**
         * 读取文件
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void)
        {
            callback && callback(null);
        }
    }
}