namespace feng3d
{

    /**
     * 可读文件系统
     */
    export class ReadFS
    {
        /**
         * 基础文件系统
         */
        get fs() { return this._fs || FS.basefs; }
        set fs(v) { this._fs = v; }
        protected _fs: IReadFS;

        /**
         * 文件系统类型
         */
        get type(): FSType
        {
            return this.fs.type;
        }

        constructor(fs?: IReadFS)
        {
            this.fs = fs;
        }

        /**
         * 读取文件为ArrayBuffer
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readArrayBuffer(path: string, callback: (err: Error, arraybuffer: ArrayBuffer) => void)
        {
            this.fs.readArrayBuffer(path, callback);
        }

        /**
         * 读取文件为字符串
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readString(path: string, callback: (err: Error, str: string) => void)
        {
            this.fs.readString(path, callback);
        }

        /**
         * 读取文件为Object
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readObject(path: string, callback: (err: Error, object: any) => void)
        {
            this.fs.readObject(path, callback);
        }

        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        readImage(path: string, callback: (err: Error, img: HTMLImageElement) => void)
        {
            this.fs.readImage(path, callback);

            // functionwrap.wrapF(this.fs, this.fs.readImage, [path], callback);
        }

        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         */
        getAbsolutePath(path: string)
        {
            return this.fs.getAbsolutePath(path);
        }

        /**
         * 读取文件列表为字符串列表
         *
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readStrings(paths: string[], callback: (strs: (string | Error)[]) => void)
        {
            task.parallelResults(paths, (path, callback) =>
            {
                this.readString(path, (err, str) =>
                {
                    callback(err || str);
                });
            }, callback);
        }

        protected _images: { [path: string]: HTMLImageElement } = {};

        private _state: { [eventtype: string]: true } = {};
    }

    FS.fs = new ReadFS();

}