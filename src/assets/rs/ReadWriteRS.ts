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
         * 延迟保存执行函数
         */
        private laterSaveFunc = (interval: number) => { this.save(); };
        /**
         * 延迟保存，避免多次操作时频繁调用保存
         */
        private laterSave = () => { ticker.nextframe(this.laterSaveFunc, this); };

        /**
         * 构建可读写资源系统
         * 
         * @param fs 可读写文件系统
         */
        constructor(fs?: ReadWriteFS)
        {
            super(fs);
        }

        /**
         * 在更改资源结构（新增，移动，删除）时会自动保存
         * 
         * @param callback 完成回调
         */
        private save(callback?: (err: Error) => void)
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
        createAsset<T extends FileAsset>(cls: new () => T, value?: gPartial<T>, parent?: FolderAsset, callback?: (err: Error, asset: T) => void)
        {
            // 新建资源
            super.createAsset(cls, value, parent, (err, asset) =>
            {
                if (asset)
                {
                    // 保存资源
                    this.writeAssets(asset, (err) =>
                    {
                        callback && callback(err, asset);

                        // 保存资源库
                        this.laterSave();
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
        writeAssets(assets: FileAsset, callback?: (err: Error) => void)
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
         * 移动资源到指定文件夹
         * 
         * @param asset 被移动资源
         * @param folder 目标文件夹
         * @param callback 完成回调
         */
        moveAssets(asset: FileAsset, folder: FolderAsset, callback?: (err: Error) => void)
        {
            var filename = asset.name + asset.extenson

            var cnames = folder.childrenAssets.map(v => v.name + v.extenson);
            if (cnames.indexOf(filename) != -1)
            {
                callback && callback(new Error(`目标文件夹中存在同名文件（夹），无法移动`));
                return;
            }
            var fp = folder;
            while (fp)
            {
                if (fp == asset)
                {
                    callback && callback(new Error(`无法移动达到子文件夹中`));
                    return;
                }
                fp = fp.parentAsset;
            }

            // 重新设置父子资源关系
            var index = asset.parentAsset.childrenAssets.indexOf(asset);
            asset.parentAsset.childrenAssets.splice(index, 1);
            folder.childrenAssets.push(asset);
            asset.parentAsset = folder;
            // 获取需要移动的资源列表
            var assets = [asset];
            var index = 0;
            while (index < assets.length)
            {
                var ca = assets[index];
                if (ca instanceof FolderAsset)
                {
                    assets = assets.concat(ca.childrenAssets);
                }
                index++;
            }

            // 最后根据 parentAsset 修复 childrenAssets
            var copyassets = assets.concat();

            // 移动最后一个资源
            var moveLastAssets = () =>
            {
                if (assets.length == 0)
                {
                    // 修复 childrenAssets
                    copyassets.forEach(v =>
                    {
                        v.parentAsset.childrenAssets.push(v);
                    });
                    callback && callback(null);
                    // 保存资源库
                    this.laterSave();
                    return;
                }
                var la = assets.pop();
                // 读取资源
                this.readAssets(la.assetsId, (err, a) =>
                {
                    if (err)
                    {
                        callback && callback(err);
                        return;
                    }
                    // 备份父资源
                    var pla = la.parentAsset;
                    // 从原路径上删除资源
                    this.deleteAssets(la.assetsId, (err) =>
                    {
                        if (err)
                        {
                            callback && callback(err);
                            return;
                        }
                        // 修复删除资源时破坏的父资源引用
                        la.parentAsset = pla;
                        // 计算资源新路径
                        var np = la.name + la.extenson;
                        var p = la.parentAsset;
                        while (p)
                        {
                            np = p.name + "/" + np;
                            p = p.parentAsset;
                        }
                        la.assetsPath = np;
                        // 新增映射
                        this.idMap[la.assetsId] = la;
                        this.pathMap[la.assetsPath] = la;
                        // 保存资源到新路径
                        this.writeAssets(la, (err) =>
                        {
                            if (err)
                            {
                                callback && callback(err);
                                return;
                            }
                            moveLastAssets();
                        });
                    });
                });
            }
            moveLastAssets();
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
            var asset = this.idMap[assetsId];
            // 获取需要移动的资源列表
            var assets = [asset];
            var index = 0;
            while (index < assets.length)
            {
                var ca = assets[index];
                if (ca instanceof FolderAsset)
                {
                    assets = assets.concat(ca.childrenAssets);
                }
                index++;
            }

            // 删除最后一个资源
            var deleteLastAssets = () =>
            {
                if (assets.length == 0)
                {
                    callback && callback(null);
                    // 保存资源库
                    this.laterSave();
                    return;
                }
                var la = assets.pop();

                // 删除 meta 文件
                this._deleteMeta(la.assetsPath, (err) =>
                {
                    if (err)
                    {
                        callback && callback(err);
                        return;
                    }
                    this.fs.deleteFile(la.assetsPath, (err) =>
                    {
                        // 删除父子资源关系
                        if (la.parentAsset)
                        {
                            var index = la.parentAsset.childrenAssets.indexOf(la.parentAsset);
                            la.parentAsset.childrenAssets.splice(index, 1);
                            la.parentAsset = null;
                        }
                        // 删除映射
                        delete this.idMap[la.assetsId];
                        delete this.pathMap[la.assetsPath];

                        deleteLastAssets();
                    });
                });

            };
            deleteLastAssets();


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