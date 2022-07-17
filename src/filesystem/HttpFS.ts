namespace feng3d
{

    /**
     * Http可读文件系统
     */
    export class HttpFS implements IReadFS
    {
        /**
         * 根路径
         */
        rootPath = '';

        type = FSType.http;

        constructor(rootPath = '')
        {
            this.rootPath = rootPath;
            if (this.rootPath === '')
            {
                if (typeof document !== 'undefined')
                {
                    const url = document.URL.split('?').shift();

                    this.rootPath = url.substring(0, url.lastIndexOf('/') + 1);
                }
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
            loader.loadBinary(this.getAbsolutePath(path),
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
            loader.loadText(this.getAbsolutePath(path),
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
        readObject(path: string, callback: (err: Error, data: any) => void)
        {
            loader.loadText(this.getAbsolutePath(path),
                (content) =>
                {
                    const obj = JSON.parse(content);

                    callback(null, obj);
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
            const img = new Image();

            img.onload = () =>
            {
                callback(null, img);
            };
            img.onerror = (_evt) =>
            {
                callback(new Error(`加载图片${path}失败`), null);
            };
            img.src = this.getAbsolutePath(path);
        }

        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        getAbsolutePath(path: string)
        {
            return this.rootPath + path;
        }
    }

    FS.basefs = new HttpFS();

}