namespace feng3d
{

    /**
     * 可读取资源文件系统
     */
    export var assets: ReadAssetsFS;

    /**
     * 可读取资源文件系统
     * 
     * 在可读文件系统上进行加工，比如把读取数据转换为图片或者文本
     */
    export class ReadAssetsFS implements ReadFS
    {
        /**
         * 可读文件系统
         */
        fs: ReadFS;

        /**
         * 正在加载的资源路径
         */
        private _loadedCallbacks: { [path: string]: Function[] } = {};

        get type()
        {
            return this.fs.type;
        }

        constructor(readFS: ReadFS = httpFS)
        {
            this.fs = readFS;
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
         * 
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readArrayBuffer(path: string, callback: (err: Error, data: ArrayBuffer) => void)
        {
            if (path == "" || path == null) 
            {
                callback(new Error("无效路径!"), null);
                return;
            }
            var readFS = this.fs;
            if (path.indexOf("http://") != -1 || path.indexOf("https://") != -1 || path.indexOf("file:///") != -1)
                readFS = httpFS;

            var callbacks = this._loadedCallbacks[path];
            if (!callbacks)
            {
                // 新建回调列表
                this._loadedCallbacks[path] = [callback];

                // 加载文件
                readFS.readArrayBuffer(path, (err, data) =>
                {
                    var callbacks = this._loadedCallbacks[path];
                    callbacks.forEach(f => f(err, data));
                    delete this._loadedCallbacks[path];
                });
            } else
            {
                // 正在加载中，新增到回调列表中
                callbacks.push(callback);
            }
        }

        /**
         * 读取文件为字符串
         */
        readString(path: string, callback: (err: Error, data: string) => void): void
        {
            this.fs.readString(path, callback);
        }

        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        readImage(path: string, callback: (err: Error, img: HTMLImageElement) => void)
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
                this.fs.readArrayBuffer(path, (err, data) =>
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
         * 读取文件为DataURL
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readDataURL(path: string, callback: (err: Error, dataurl: string) => void)
        {
            this.fs.readArrayBuffer(path, (err, data) =>
            {
                feng3d.dataTransform.arrayBufferToDataURL(data, (dataurl) =>
                {
                    callback(null, dataurl);
                });
            });
        }

        /**
         * 读取文件为Blob
         * @param path 资源路径
         * @param callback 读取完成回调 
         */
        readBlob(path: string, callback: (err: Error, blob: Blob) => void)
        {
            this.fs.readArrayBuffer(path, (err, data) =>
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

        /**
         * 读取文件为对象
         * @param path 资源路径
         * @param callback 读取完成回调
         */
        readObject(path: string, callback: (err: Error, object: Object) => void)
        {
            this.fs.readObject(path, (err, object) =>
            {
                var obj = object;
                if (obj)
                    obj = serialization.deserialize(obj);
                callback(err, object);
            });
        }

        /**
         * 读取文件为资源对象
         * @param id 资源编号
         * @param callback 读取完成回调
         */
        readAssets(id: string, callback: (err: Error, assets: Feng3dAssets) => void)
        {
            var assets = Feng3dAssets.getAssets(id);
            if (assets)
            {
                callback(null, assets);
                return;
            }
            var assetsPath = assetsIDPathMap.getPath(id);
            this.readObject(assetsPath, (err, assets: Feng3dAssets) =>
            {
                if (assets) Feng3dAssets.setAssets(assets);
                if (assets instanceof Feng3dFile)
                {
                    assets["readFile"](this, err =>
                    {
                        callback(err, assets);
                    });
                } else
                {
                    callback(err, assets);
                }
            });
        }
    }

    assets = new ReadAssetsFS();
}