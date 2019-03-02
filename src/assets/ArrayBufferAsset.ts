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
         * 
         * @param callback 完成回调
         */
        protected saveFile(callback?: (err: Error) => void)
        {
            if (!(this.rs.fs instanceof ReadWriteFS)) return;
            this.rs.fs.writeArrayBuffer(this.assetPath, this.arraybuffer, callback);
        }

        /**
         * 读取文件
         * 
         * @param callback 完成回调
         */
        protected readFile(callback?: (err: Error) => void)
        {
            this.rs.fs.readArrayBuffer(this.assetPath, (err, data) =>
            {
                this.arraybuffer = data;
                callback && callback(err);
            })
        }
    }
}