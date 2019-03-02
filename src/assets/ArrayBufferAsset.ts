namespace feng3d
{
    /**
     * 二进制 资源
     */
    export class ArrayBufferAsset extends FileAsset
    {
        @oav()
        name: string;

        /**
         * 文件数据
         */
        arraybuffer: ArrayBuffer;

        /**
         * 保存文件
         * @param fs 可读写资源管理系统
         * @param callback 完成回调
         */
        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            fs.writeArrayBuffer(this.assetPath, this.arraybuffer, callback);
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(fs: ReadFS, callback?: (err: Error) => void)
        {
            fs.readArrayBuffer(this.assetPath, (err, data) =>
            {
                this.arraybuffer = data;
                callback && callback(err);
            })
        }
    }
}