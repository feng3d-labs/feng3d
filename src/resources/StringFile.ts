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

        protected saveFile(readWriteAssets: ReadWriteAssets, callback?: (err: Error) => void)
        {
            readWriteAssets.writeString(this.filePath, this.textContent, callback);
        }

        /**
         * 读取文件
         * @param readAssets 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(readAssets: ReadAssets, callback?: (err: Error) => void)
        {
            readAssets.readString(this.filePath, (err, data) =>
            {
                this.textContent = data;
                callback && callback(err);
            });
        }
    }
}