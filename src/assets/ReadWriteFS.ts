namespace feng3d
{
    /**
     * 可读写文件系统
     * 
     * 扩展基础可读写文件系统
     */
    export class ReadWriteFS extends ReadFS implements IBaseReadWriteFS
    {
        projectname: string;

        protected _fs: IBaseReadWriteFS;

        constructor(baseReadWriteFS: IBaseReadWriteFS)
        {
            super(baseReadWriteFS);
            this._fs = baseReadWriteFS;
        }

        /**
         * 获取文件状态。
         * 
         * @param path 文件的路径。
         * @param callback 完成回调。
         */
        stat(path: string, callback: (err: Error, stats: FileStats) => void): void
        {
            this._fs.stat(path, callback);
        }

        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        exists(path: string, callback: (exists: boolean) => void): void
        {
            this._fs.exists(path, callback);
        }

        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        readdir(path: string, callback: (err: Error, files: string[]) => void): void
        {
            this._fs.readdir(path, callback);
        }

        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        mkdir(path: string, callback?: (err: Error) => void): void
        {
            this._fs.mkdir(path, callback);
        }

        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        deleteFile(path: string, callback?: (err: Error) => void): void
        {
            this._fs.deleteFile(path, callback);
        }

        /**
         * 写ArrayBuffer(新建)文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeArrayBuffer(path: string, data: ArrayBuffer, callback?: (err: Error) => void): void
        {
            this._fs.writeArrayBuffer(path, data, callback);
        }

        /**
         * 写字符串到(新建)文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeString(path: string, data: string, callback?: (err: Error) => void): void
        {
            this._fs.writeString(path, data, callback);
        }

        /**
         * 写Object到(新建)文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeObject(path: string, data: Object, callback?: (err: Error) => void): void
        {
            this._fs.writeObject(path, data, callback);
        }

        /**
         * 写图片
         * @param path 图片路径
         * @param image 图片
         * @param callback 回调函数
         */
        writeImage(path: string, image: HTMLImageElement, callback: (err: Error) => void)
        {
            this._fs.writeImage(path, image, callback);
        }

        /**
         * 复制文件
         * @param src    源路径
         * @param dest    目标路径
         * @param callback 回调函数
         */
        copyFile(src: string, dest: string, callback?: (err: Error) => void)
        {
            this._fs.copyFile(src, dest, callback);
        }
    }
}