namespace feng3d
{
    /**
     * 字符串 资源
     */
    export abstract class StringAsset extends FileAsset
    {
        @oav({ component: "OAVMultiText" })
        textContent: string;

        saveFile(callback?: (err: Error) => void)
        {
            this.rs.fs.writeString(this.assetPath, this.textContent, callback);
        }

        /**
         * 读取文件
         * 
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void)
        {
            this.rs.fs.readString(this.assetPath, (err, data) =>
            {
                this.textContent = data;
                callback && callback(err);
            });
        }
    }
}