namespace feng3d
{
    /**
     * 资源元标签文件后缀
     */
    const metaSuffix = ".meta";

    /**
     * 可读写资源文件系统
     */
    export class ReadWriteAssetsFS extends ReadAssetsFS
    {
        /**
         * 可读写文件系统
         */
        get fs() { return this._fs; }
        protected _fs: ReadWriteFS;

        constructor(readWriteFS: IBaseReadWriteFS = indexedDBFS)
        {
            super(readWriteFS);
            this._fs = new ReadWriteFS(readWriteFS);
        }

        /**
         * 写（保存）资源
         * 
         * @param assets 资源对象
         * @param callback 完成回调
         */
        writeAssets(assets: Feng3dAssets, callback?: (err: Error) => void)
        {
            var path = assetsIDPathMap.getPath(assets.assetsId);

            this._readMeta(path, (err, meta) =>
            {
                if (!meta) meta = {
                    guid: assets.assetsId, isDirectory: assets instanceof Feng3dFolder,
                    mtimeMs: Date.now(), birthtimeMs: Date.now(), assetType: assets.assetType,
                };
                meta.mtimeMs = Date.now();

                this._writeMeta(path, meta, (err) =>
                {
                    if (err)
                    {
                        callback && callback(err);
                        return;
                    }
                    this.fs.writeObject(path, assets, callback);
                });
            });
        }

        /**
         * 删除资源
         * 
         * @param assets 资源对象
         * @param callback 完成回调
         */
        deleteAssets(assets: Feng3dAssets, callback?: (err: Error) => void)
        {
            var path = assetsIDPathMap.getPath(assets.assetsId);

            this._deleteMeta(path, (err) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }
                this.fs.deleteFile(path, callback);
            });
        }

        /**
         * 读取资源元标签
         * 
         * @param path 资源路径
         * @param callback 完成回调 
         */
        private _readMeta(path: string, callback?: (err: Error, meta: AssetsMeta) => void)
        {
            this.fs.readObject(path + metaSuffix, callback);
        }

        /**
         * 写资源元标签
         * 
         * @param path 资源路径
         * @param meta 资源元标签
         * @param callback 完成回调
         */
        private _writeMeta(path: string, meta: AssetsMeta, callback?: (err: Error) => void)
        {
            this.fs.writeObject(path + metaSuffix, meta, callback);
        }

        /**
         * 删除资源元标签
         * 
         * @param path 资源路径 
         * @param callback 完成回调
         */
        private _deleteMeta(path: string, callback?: (err: Error) => void)
        {
            this.fs.deleteFile(path + metaSuffix, callback);
        }
    }
}