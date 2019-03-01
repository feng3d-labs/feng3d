namespace feng3d
{
    /**
     * 文件夹资源
     */
    export class FolderAsset extends FileAsset
    {
        @oav()
        name: string;

        assetType = AssetExtension.folder;

        /**
         * 子资源列表
         */
        @serialize
        childrenAssets: FileAsset[] = [];

        extenson = "";

        /**
         * 保存文件
         * @param fs 可读写资源管理系统
         * @param callback 完成回调
         */
        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            fs.mkdir(this.assetsPath, callback);
        }
    }
}