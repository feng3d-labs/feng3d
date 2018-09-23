namespace feng3d
{
    export class Feng3dFile extends Feng3dAssets
    {
        /**
         * 文件名称
         */
        @serialize
        @watch("fileNameChanged")
        filename: string;

        /**
         * 文件数据
         */
        arraybuffer: ArrayBuffer;

        /**
         * 文件路径
         */
        filePath: string;

        /**
         * 保存资源
         * @param readWriteAssets 
         * @param callback  完成回调 
         */
        save(readWriteAssets: ReadWriteAssets, callback?: (err: Error) => void): any
        {
            super.save(readWriteAssets, (err) =>
            {
                if (err)
                {
                    callback(err);
                    return;
                }
                this.saveFile(readWriteAssets, callback);
            });
        }

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
            readAssets.readArrayBuffer(this.filename, (err, data) =>
            {
                this.arraybuffer = data;
                callback && callback(err);
            })
        }

        protected fileNameChanged()
        {
            this.filePath = `Library/${this.assetsId}/file/` + this.filename;
        }

        protected assetsIdChanged()
        {
            super.assetsIdChanged();
            this.filePath = `Library/${this.assetsId}/file/` + this.filename;
        }
    }
}