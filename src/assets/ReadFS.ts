namespace feng3d
{
    /**
     * 可读文件系统
     * 
     * 针对基础文件系统进行扩展
     */
    export class ReadFS implements IBaseReadFS
    {
        /**
         * 基础文件系统
         */
        get baseFS() { return this._fs; }
        protected _fs: IBaseReadFS;

        /**
         * 文件系统类型
         */
        get type()
        {
            return this._fs.type;
        }

        constructor(baseReadFS: IBaseReadFS)
        {
            this._fs = baseReadFS;
        }

        /**
         * 读取文件为ArrayBuffer
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readArrayBuffer(path: string, callback: (err: Error, data: ArrayBuffer) => void)
        {
            this._fs.readArrayBuffer(path, callback);
        }

        /**
         * 读取文件为字符串
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readString(path: string, callback: (err: Error, data: string) => void)
        {
            this._fs.readString(path, callback);
        }

        /**
         * 读取文件为Object
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readObject(path: string, callback: (err: Error, data: Object) => void)
        {
            this._fs.readObject(path, callback);
        }

        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        readImage(path: string, callback: (err: Error, img: HTMLImageElement) => void)
        {
            this._fs.readImage(path, callback);
        }

        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        getAbsolutePath(path: string, callback: (err: Error, absolutePath: string) => void): void
        {
            this._fs.getAbsolutePath(path, callback);
        }
    }
}