namespace feng3d
{
    /**
     * Http可读文件系统
     */
    export var httpFS: HttpFS;

    /**
     * Http可读文件系统
     */
    export class HttpFS implements ReadFS
    {
        /**
         * 根路径
         */
        rootPath = "";

        get type()
        {
            return FSType.http;
        }

        constructor()
        {
            this.rootPath = document.URL.substring(0, document.URL.lastIndexOf("/") + 1);
        }

        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFile(path: string, callback: (err, data: ArrayBuffer) => void)
        {
            // rootPath
            Loader.loadBinary(path,
                (content) =>
                {
                    callback(null, content);
                },
                null,
                (e) =>
                {
                    callback(e, null);
                });
        }

        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        getAbsolutePath(path: string, callback: (err: Error, absolutePath: string) => void): void
        {
            callback(null, this.rootPath + path);
        }
    }
    httpFS = new HttpFS();
}