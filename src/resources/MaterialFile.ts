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
        @oav({ component: "OAVObjectView" })
        material: Material;

        assetType = AssetExtension.material;

        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            this.material.assetsId = this.assetsId;
            fs.writeObject(this.assetsPath, this.material, callback);
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(fs: ReadFS, callback?: (err: Error) => void)
        {
            fs.readObject(this.assetsPath, (err, data: Material) =>
            {
                this.material = data;
                this.material.assetsId = this.assetsId;
                callback && callback(err);
            });
        }
    }

    Feng3dAssets.assetTypeClassMap[AssetExtension.material] = MaterialFile;
}