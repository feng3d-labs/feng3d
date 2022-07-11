namespace feng3d
{
    /**
     * 二进制 资源
     */
    export class ArrayBufferAsset extends FileAsset
    {
        /**
         * 文件数据
         */
        arraybuffer: ArrayBuffer;

        /**
         * 保存文件
         * 
         * @param callback 完成回调
         */
        saveFile(callback?: (err: Error) => void)
        {
            this.rs.readWriteFS.writeArrayBuffer(this.assetPath, this.arraybuffer, callback);
        }

        /**
         * 读取文件
         * 
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void)
        {
            this.rs.fs.readArrayBuffer(this.assetPath, (err, data) =>
            {
                this.arraybuffer = data;
                callback && callback(err);
            })
        }
    }
}