namespace feng3d
{
    /**
     * 材质文件
     */
    export class MaterialFile extends Feng3dFile
    {
        /**
         * 材质
         */
        @oav()
        material: Material;

        assetType = AssetExtension.material;

        protected saveFile(readWriteAssets: ReadWriteAssetsFS, callback?: (err: Error) => void)
        {
            this.material.assetsId = this.assetsId;
            readWriteAssets.fs.writeObject(this.assetsPath, this.material, callback);
        }

        /**
         * 读取文件
         * @param readAssets 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(readAssets: ReadAssetsFS, callback?: (err: Error) => void)
        {
            readAssets.fs.readObject(this.assetsPath, (err, data: Material) =>
            {
                this.material = data;
                this.material.assetsId = this.assetsId;
                callback && callback(err);
            });
        }
    }

    Feng3dAssets.assetTypeClassMap[AssetExtension.material] = MaterialFile;
}