namespace feng3d
{
    /**
     * 二进制文件
     */
    export class ArrayBufferFile extends Feng3dFile
    {
        /**
         * 文件数据
         */
        arraybuffer: ArrayBuffer;

        /**
         * 保存文件
         * @param readWriteAssets 可读写资源管理系统
         * @param callback 完成回调
         */
        protected saveFile(readWriteAssets: ReadWriteAssets, callback?: (err: Error) => void)
        {
            readWriteAssets.writeArrayBuffer(this.filePath, this.arraybuffer, callback);
        }

        /**
         * 读取文件
         * @param readAssets 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(readAssets: ReadAssets, callback?: (err: Error) => void)
        {
            readAssets.readArrayBuffer(this.filePath, (err, data) =>
            {
                this.arraybuffer = data;
                callback && callback(err);
            })
        }
    }
}