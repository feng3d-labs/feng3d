namespace feng3d
{
    /**
     * Http可读文件系统
     */
    export var httpFS: HttpFS;

    /**
     * Http可读文件系统
     */
    export class HttpFS implements IBaseReadFS
    {
        /**
         * 根路径
         */
        rootPath = "";

        get type()
        {
            return FSType.http;
        }

        constructor(rootPath = "")
        {
            this.rootPath = rootPath;
            if (this.rootPath == "")
            {
                this.rootPath = document.URL.substring(0, document.URL.lastIndexOf("/") + 1);
            }
        }

        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readArrayBuffer(path: string, callback: (err: Error, data: ArrayBuffer) => void)
        {
            // rootPath
            loader.loadBinary(this._getAbsolutePath(path),
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
         * 读取文件为字符串
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readString(path: string, callback: (err: Error, data: string) => void)
        {
            loader.loadText(this._getAbsolutePath(path),
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
         * 读取文件为Object
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readObject(path: string, callback: (err: Error, data: Object) => void)
        {
            loader.loadText(this._getAbsolutePath(path),
                (content) =>
                {
                    var obj = JSON.stringify(content);
                    var object = serialization.deserialize(obj);
                    callback(null, object);
                },
                null,
                (e) =>
                {
                    callback(e, null);
                });
        }

        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        readImage(path: string, callback: (err: Error, img: HTMLImageElement) => void)
        {
            var img = new Image();
            img.onload = function ()
            {
                callback(null, img);
            };
            img.onerror = (evt) =>
            {
                callback(new Error(`加载图片${path}失败`), null);
            }
            img.src = this._getAbsolutePath(path);
        }

        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        getAbsolutePath(path: string, callback: (err: Error, absolutePath: string) => void): void
        {
            callback(null, this._getAbsolutePath(path));
        }

        private _getAbsolutePath(path: string)
        {
            return this.rootPath + path;
        }
    }
    httpFS = new HttpFS();
}