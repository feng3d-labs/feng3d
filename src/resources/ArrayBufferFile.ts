namespace feng3d
{
    /**
     * 二进制文件
     */
    export class ArrayBufferFile extends Feng3dFile
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
            var assetsPath = assetsIDPathMap.getPath(this.assetsId);
            fs.writeArrayBuffer(assetsPath, this.arraybuffer, callback);
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(fs: ReadFS, callback?: (err: Error) => void)
        {
            var assetsPath = assetsIDPathMap.getPath(this.assetsId);
            fs.readArrayBuffer(assetsPath, (err, data) =>
            {
                this.arraybuffer = data;
                callback && callback(err);
            })
        }
    }
}