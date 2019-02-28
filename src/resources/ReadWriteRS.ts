namespace feng3d
{
    /**
     * 可读写资源系统
     */
    export class ReadWriteRS extends ReadRS
    {
        /**
         * 文件系统
         */
        fs: ReadWriteFS;

        /**
         * 构建可读写资源系统
         * 
         * @param fs 可读写文件系统
         */
        constructor(fs: ReadWriteFS = feng3d.indexedDBFS)
        {
            super(fs);
        }

        /**
         * 保存
         * 
         * @param callback 完成回调
         */
        save(callback?: (err: Error) => void)
        {
            this.fs.writeObject(this.resources, this.root, callback)
        }

        /**
         * 新建资源
         * 
         * @param cls 资源类定义
         * @param value 初始数据
         * @param parent 所在文件夹，如果值为null时默认添加到根文件夹中
         * @param callback 完成回调函数
         */
        createAsset<T extends Feng3dAssets>(cls: new () => T, value?: gPartial<T>, parent?: Feng3dFolder, callback?: (err: Error, asset: T) => void)
        {
            super.createAsset(cls, value, parent, (err, asset) =>
            {
                if (asset)
                {
                    this.writeAssets(asset, (err) =>
                    {
                        callback && callback(err, asset);
                    });
                } else
                {
                    callback && callback(err, null);
                }
            });
        }

        /**
         * 写（保存）资源
         * 
         * @param assets 资源对象
         * @param callback 完成回调
         */
        writeAssets(assets: Feng3dAssets, callback?: (err: Error) => void)
        {
            assets.meta.mtimeMs = Date.now();
            this._writeMeta(assets.assetsPath, assets.meta, (err) =>
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
         * 删除资源
         * 
         * @param assetsId 资源编号
         * @param callback 完成回调
         */
        deleteAssets(assetsId: string, callback?: (err: Error) => void)
        {
            var assets = this.idMap[assetsId];

            this._deleteMeta(assets.assetsPath, (err) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }
                // 如果该资源为文件夹 则 删除该文件夹以及文件夹内所有资源
                if (assets.assetType == AssetExtension.folder)
                {
                    this.fs.getAllfilepathInFolder(assets.assetsPath, (err, filepaths) =>
                    {
                        if (err)
                        {
                            callback && callback(err);
                            return;
                        }
                        filepaths.forEach(v =>
                        {
                            var cid = this.pathMap[v];
                            if (cid)
                            {
                                delete this.idMap[cid.assetsId];
                                delete this.pathMap[cid.assetsPath];
                            }
                        });

                        this.fs.delete(assets.assetsPath, callback);
                    });
                } else
                {
                    this.fs.deleteFile(assets.assetsPath, callback);
                }
                delete this.idMap[assets.assetsId];
                delete this.pathMap[assets.assetsPath];
            });
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