namespace feng3d
{
    /**
     * 字符串 资源
     */
    export abstract class StringAsset extends FileAsset
    {
        @oav({ component: "OAVMultiText" })
        textContent: string;

        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            fs.writeString(this.assetPath, this.textContent, callback);
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(fs: ReadFS, callback?: (err: Error) => void)
        {
            fs.readString(this.assetPath, (err, data) =>
            {
                this.textContent = data;
                callback && callback(err);
            });
        }
    }
}