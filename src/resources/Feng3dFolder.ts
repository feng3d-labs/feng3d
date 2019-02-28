namespace feng3d
{
    /**
     * 文件夹资源
     */
    export class Feng3dFolder extends Feng3dAssets
    {
        @oav()
        name: string;

        assetType = AssetExtension.folder;

        /**
         * 保存文件
         * @param fs 可读写资源管理系统
         * @param callback 完成回调
         */
        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            var assetsPath = assetsIDPathMap.getPath(this.assetsId);
            fs.mkdir(assetsPath, callback);
        }
    }

    Feng3dAssets.assetTypeClassMap[AssetExtension.folder] = Feng3dFolder;
}