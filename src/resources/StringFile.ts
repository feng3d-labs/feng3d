namespace feng3d
{
    /**
     * 字符串文件
     */
    export class StringFile extends Feng3dFile
    {
        @oav({ component: "OAVMultiText" })
        textContent: string;

        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            fs.writeString(this.assetsPath, this.textContent, callback);
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(fs: ReadFS, callback?: (err: Error) => void)
        {
            fs.readString(this.assetsPath, (err, data) =>
            {
                this.textContent = data;
                callback && callback(err);
            });
        }
    }
}