namespace feng3d
{
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

        constructor(readWriteFS: ReadWriteFS = indexedDBFS)
        {
            super(readWriteFS);
            this._fs = readWriteFS;
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

            assets.meta.mtimeMs = Date.now();
            this._writeMeta(path, assets.meta, (err) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }

                assets["saveFile"](this.fs, err =>
                {
                    callback && callback(err);
                });
            });
        }

        /**
         * 删除资源
         * 
         * @param assetsId 资源编号
         * @param callback 完成回调
         */
        deleteAssets(assetsId: string, callback?: (err: Error) => void)
        {
            var item = assetsIDPathMap.getItem(assetsId);
            var path = item.path;

            this._deleteMeta(path, (err) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }
                assetsIDPathMap.deleteByID(assetsId);
                // 如果该资源为文件夹 则 删除该文件夹以及文件夹内所有资源
                if (item.assetType == AssetExtension.folder)
                {
                    this.fs.getAllfilepathInFolder(path, (err, filepaths) =>
                    {
                        if (err)
                        {
                            callback && callback(err);
                            return;
                        }
                        var deleteIDs = filepaths.reduce((pv: string[], cv) =>
                        {
                            var cid = assetsIDPathMap.getID(cv);
                            if (cid) pv.push(cid);
                            return pv;
                        }, []);
                        deleteIDs.forEach(element =>
                        {
                            assetsIDPathMap.deleteByID(element);
                        });
                        this.fs.delete(path, callback);
                    });
                } else
                {
                    this.fs.deleteFile(path, callback);
                }
            });
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