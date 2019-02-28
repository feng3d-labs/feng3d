namespace feng3d
{
    /**
     * feng3d资源
     */
    export class Feng3dAssets extends Feng3dObject
    {
        /**
         * 资源编号
         */
        @serialize
        assetsId: string;

        /**
         * 名称
         */
        @oav()
        @serialize
        name = "";

        /**
         * 资源元标签
         */
        meta: AssetsMeta;

        /**
         * 资源路径
         */
        get assetsPath()
        {
            if (!this.assetsId) return "";
            return assetsIDPathMap.getPath(this.assetsId);
        }

        /**
         * 资源类型，由具体对象类型决定
         */
        assetType: AssetExtension;

        constructor()
        {
            super();
        }

        /**
         * 保存文件
         * @param fs 可读写资源管理系统
         * @param callback 完成回调
         */
        protected saveFile(fs: ReadWriteFS, callback?: (err: Error) => void)
        {
            callback && callback(null);
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(fs: ReadFS, callback?: (err: Error) => void)
        {
            callback && callback(null);
        }

        /**
         * 读取文件为资源对象
         * @param id 资源编号
         * @param callback 读取完成回调
         */
        static readAssets(fs: ReadFS, id: string, callback: (err: Error, assets: Feng3dAssets) => void)
        {
            var feng3dAsset = Feng3dAssets.getAssets(id);
            if (feng3dAsset)
            {
                callback(null, feng3dAsset);
                return;
            }
            var path = assetsIDPathMap.getPath(id);
            this._readMeta(fs, path, (err, meta) =>
            {
                if (err)
                {
                    callback(err, null);
                    return;
                }
                var cls = Feng3dAssets.assetTypeClassMap[meta.assetType];
                var newFeng3dAsset: Feng3dAssets = new cls();
                newFeng3dAsset.meta = meta;
                newFeng3dAsset.assetsId = meta.guid;
                Feng3dAssets.setAssets(newFeng3dAsset);
                feng3d.assert(newFeng3dAsset.assetType == meta.assetType);

                newFeng3dAsset.readFile(fs, err =>
                {
                    callback(err, newFeng3dAsset);
                });
            });
        }

        /**
         * 写（保存）资源
         * 
         * @param assets 资源对象
         * @param callback 完成回调
         */
        static writeAssets(fs: ReadWriteFS, assets: Feng3dAssets, callback?: (err: Error) => void)
        {
            var path = assetsIDPathMap.getPath(assets.assetsId);

            assets.meta.mtimeMs = Date.now();
            this._writeMeta(fs, path, assets.meta, (err) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }

                assets.saveFile(fs, err =>
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
        static deleteAssets(fs: ReadWriteFS, assetsId: string, callback?: (err: Error) => void)
        {
            var item = assetsIDPathMap.getItem(assetsId);
            var path = item.path;

            this._deleteMeta(fs, path, (err) =>
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
                    fs.getAllfilepathInFolder(path, (err, filepaths) =>
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
                        fs.delete(path, callback);
                    });
                } else
                {
                    fs.deleteFile(path, callback);
                }
            });
        }

        /**
         * 读取资源元标签
         * 
         * @param path 资源路径
         * @param callback 完成回调 
         */
        private static _readMeta(fs: ReadFS, path: string, callback?: (err: Error, meta: AssetsMeta) => void)
        {
            fs.readObject(path + metaSuffix, callback);
        }

        /**
         * 写资源元标签
         * 
         * @param path 资源路径
         * @param meta 资源元标签
         * @param callback 完成回调
         */
        private static _writeMeta(fs: ReadWriteFS, path: string, meta: AssetsMeta, callback?: (err: Error) => void)
        {
            fs.writeObject(path + metaSuffix, meta, callback);
        }

        /**
         * 删除资源元标签
         * 
         * @param path 资源路径
         * @param callback 完成回调
         */
        private static _deleteMeta(fs: ReadWriteFS, path: string, callback?: (err: Error) => void)
        {
            fs.deleteFile(path + metaSuffix, callback);
        }

        static setAssets(assets: Feng3dAssets)
        {
            this._lib.set(assets.assetsId, assets);
        }

        /**
         * 获取资源
         * @param assetsId 资源编号
         */
        static getAssets(assetsId: string)
        {
            return this._lib.get(assetsId);
        }

        /**
         * 获取指定类型资源
         * @param type 资源类型
         */
        static getAssetsByType<T extends Feng3dAssets>(type: Constructor<T>): T[]
        {
            return <any>this._lib.getValues().filter(v => v instanceof type);
        }

        private static _lib = new Map<string, Feng3dAssets>();

        static assetTypeClassMap: { [type: string]: Constructor<Feng3dAssets> } = {};
    }
}