namespace feng3d
{

    /**
     * 可读取资源文件系统
     */
    export var assets: ReadAssetsFS;

    /**
     * 可读取资源文件系统
     */
    export class ReadAssetsFS
    {
        /**
         * 可读文件系统
         */
        fs: ReadFS;

        get type()
        {
            return this.fs.type;
        }

        constructor(readFS: ReadFS = httpFS)
        {
            this.fs = readFS;
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