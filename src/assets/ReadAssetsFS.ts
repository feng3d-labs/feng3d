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
        get fs() { return this._fs; }
        protected _fs: ReadFS;

        constructor(readFS: IBaseReadFS = httpFS)
        {
            this._fs = new ReadFS(readFS);
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
            var path = assetsIDPathMap.getPath(id);
            this._readMeta(path, (err, meta) =>
            {
                if (err)
                {
                    callback(err, null);
                    return;
                }
                if (meta.isDirectory)
                {
                    var feng3dFolder = new Feng3dFolder();
                    feng3dFolder.assetsId = meta.guid;

                    callback(null, feng3dFolder);
                } else
                {
                    this._fs.readObject(path, (err, assets: Feng3dAssets) =>
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
            });
        }

        /**
         * 读取资源元标签
         * 
         * @param path 资源路径
         * @param callback 完成回调 
         */
        protected _readMeta(path: string, callback?: (err: Error, meta: AssetsMeta) => void)
        {
            this.fs.readObject(path + metaSuffix, callback);
        }
    }

    assets = new ReadAssetsFS();
}