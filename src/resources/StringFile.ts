namespace feng3d
{
    /**
     * 字符串文件
     */
    export class StringFile extends Feng3dFile
    {
        @oav()
        name: string;

        @oav({ component: "OAVMultiText" })
        textContent: string;

        protected saveFile(readWriteAssets: ReadWriteAssetsFS, callback?: (err: Error) => void)
        {
            var assetsPath = assetsIDPathMap.getPath(this.assetsId);
            readWriteAssets.fs.writeString(assetsPath, this.textContent, callback);
        }

        /**
         * 读取文件
         * @param readAssets 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(readAssets: ReadAssetsFS, callback?: (err: Error) => void)
        {
            var assetsPath = assetsIDPathMap.getPath(this.assetsId);
            readAssets.fs.readString(assetsPath, (err, data) =>
            {
                this.textContent = data;
                callback && callback(err);
            });
        }
    }
}