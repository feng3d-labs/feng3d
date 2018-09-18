namespace feng3d
{

    /**
     * 资源系统
     */
    export var assets: ReadAssets;

    /**
     * 资源
     * 在可读文件系统上进行加工，比如把读取数据转换为图片或者文本
     */
    export class ReadAssets implements ReadFS
    {
        /**
         * 可读文件系统
         */
        fs: ReadFS = httpFS;

        get type()
        {
            return this.fs.type;
        }

        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        getAbsolutePath(path: string, callback: (err: Error, absolutePath: string) => void): void
        {
            this.fs.getAbsolutePath(path, callback);
        }

        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFileAsArrayBuffer(path: string, callback: (err: Error, data: ArrayBuffer) => void)
        {
            if (path == "" || path == null) 
            {
                callback(new Error("无效路径!"), null);
                return;
            }
            var readFS = this.fs;
            if (path.indexOf("http://") != -1 || path.indexOf("https://") != -1 || path.indexOf("file:///") != -1)
                readFS = httpFS;

            readFS.readFileAsArrayBuffer(path, callback);
        }

        /**
         * 读取文件为字符串
         */
        readFileAsString(path: string, callback: (err: Error | null, data: string | null) => void): void
        {
            this.readFileAsArrayBuffer(path, (err, data) =>
            {
                if (err)
                {
                    callback(err, null);
                    return;
                }
                dataTransform.arrayBufferToString(data, (content) =>
                {
                    callback(null, content);
                });
            });
        }

        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        readFileAsImage(path: string, callback: (err: Error, img: HTMLImageElement) => void)
        {
            if (path.indexOf("http://") != -1 || path.indexOf("https://") != -1 || path.indexOf("file:///") != -1)
            {
                var img = new Image();
                img.onload = function ()
                {
                    callback(null, img);
                };
                img.src = path;
            } else
            {
                this.readFileAsArrayBuffer(path, (err, data) =>
                {
                    if (err)
                    {
                        callback(err, null);
                        return;
                    }
                    dataTransform.arrayBufferToImage(data, (img) =>
                    {
                        callback(null, img);
                    });
                });
            }
        }

        /**
         * 读取文件为Blob
         * @param path 资源路径
         * @param callback 读取完成回调 
         */
        readFileAsBlob(path: string, callback: (err: Error, blob: Blob) => void)
        {
            assets.readFileAsArrayBuffer(path, (err, data) =>
            {
                if (err)
                {
                    callback(err, null);
                    return;
                }
                feng3d.dataTransform.arrayBufferToBlob(data, (blob) =>
                {
                    callback(null, blob);
                });
            });
        }

    }

    assets = new ReadAssets();

}