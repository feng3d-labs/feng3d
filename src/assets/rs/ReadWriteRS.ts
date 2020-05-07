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
            var allAssets = this.getAllAssets();
            var object = serialization.serialize(allAssets);
            this.fs.writeObject(this.resources, object, callback)
        }

        /**
         * 新建资源
         * 
         * @param cls 资源类定义
         * @param fileName 文件名称
         * @param value 初始数据
         * @param parent 所在文件夹，如果值为null时默认添加到根文件夹中
         * @param callback 完成回调函数
         */
        createAsset<T extends FileAsset>(cls: new () => T, fileName?: string, value?: gPartial<T>, parent?: FolderAsset, callback?: (err: Error, asset: T) => void)
        {
            // 新建资源
            super.createAsset(cls, fileName, value, parent, (err, asset) =>
            {
                if (asset)
                {
                    // 保存资源
                    this.writeAsset(asset, (err) =>
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
         * @param asset 资源对象
         * @param callback 完成回调
         */
        writeAsset(asset: FileAsset, callback?: (err: Error) => void)
        {
            asset.write(callback);
        }

        /**
         * 移动资源到指定文件夹
         * 
         * @param asset 被移动资源
         * @param folder 目标文件夹
         * @param callback 完成回调
         */
        moveAsset(asset: FileAsset, folder: FolderAsset, callback?: (err: Error) => void)
        {
            var filename = asset.fileName + asset.extenson

            var cnames = folder.childrenAssets.map(v => v.fileName + v.extenson);
            if (cnames.indexOf(filename) != -1)
            {
                callback && callback(new Error(`目标文件夹中存在同名文件（夹），无法移动`));
                return;
            }
            var fp = folder;
            while (fp)
            {
                if (fp == <any>asset)
                {
                    callback && callback(new Error(`无法移动达到子文件夹中`));
                    return;
                }
                fp = fp.parentAsset;
            }

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
            var moveLastAsset = () =>
            {
                if (assets.length == 0)
                {
                    callback && callback(null);
                    // 保存资源库
                    this.laterSave();
                    return;
                }
                var la = assets.pop();
                // 读取资源
                this.readAsset(la.assetId, (err, a) =>
                {
                    if (err)
                    {
                        callback && callback(err);
                        return;
                    }
                    // 从原路径上删除资源
                    this.deleteAsset(la, (err) =>
                    {
                        if (err)
                        {
                            callback && callback(err);
                            return;
                        }
                        // 计算资源新路径
                        var np = la.fileName + la.extenson;
                        var p = la.parentAsset;
                        while (p)
                        {
                            np = p.fileName + "/" + np;
                            p = p.parentAsset;
                        }
                        la.assetPath = np;
                        // 新增映射
                        this.addAsset(la);
                        // 保存资源到新路径
                        this.writeAsset(la, (err) =>
                        {
                            if (err)
                            {
                                callback && callback(err);
                                return;
                            }
                            moveLastAsset();
                        });
                    });
                });
            }
            moveLastAsset();
        }

        /**
         * 删除资源
         * 
         * @param asset 资源
         * @param callback 完成回调
         */
        deleteAsset(asset: FileAsset, callback?: (err: Error) => void)
        {
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
            var deleteLastAsset = () =>
            {
                if (assets.length == 0)
                {
                    callback && callback(null);
                    // 保存资源库
                    this.laterSave();
                    return;
                }
                var la = assets.pop();

                la.delete(() =>
                {
                    AssetData.deleteAssetData(la.data);
                    deleteLastAsset();
                });
            };
            deleteLastAsset();
        }
    }
}