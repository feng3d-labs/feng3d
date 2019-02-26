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

        /**
         * 资源路径
         */
        get assetsPath()
        {
            return assetsIDPathMap.getPath(this.assetsId);
        }

        protected saveFile(readWriteAssets: ReadWriteAssetsFS, callback?: (err: Error) => void)
        {
            readWriteAssets.fs.writeString(this.assetsPath, this.textContent, callback);
        }

        /**
         * 读取文件
         * @param readAssets 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(readAssets: ReadAssetsFS, callback?: (err: Error) => void)
        {
            readAssets.fs.readString(this.assetsPath, (err, data) =>
            {
                this.textContent = data;
                callback && callback(err);
            });
        }
    }
}