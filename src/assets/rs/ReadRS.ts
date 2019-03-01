namespace feng3d
{
    /**
     * 默认资源系统
     */
    export var rs: ReadRS;

    /**
     * 可读资源系统
     */
    export class ReadRS
    {
        /**
         * 文件系统
         */
        get fs() { return this._fs || fs; }
        private _fs: ReadFS;

        /**
         * 根文件夹
         */
        get root() { return this._root; }
        private _root: FolderAsset;

        /**
         * 资源编号映射
         */
        protected idMap: { [id: string]: FileAsset } = {};

        /**
         * 资源路径映射
         */
        protected pathMap: { [path: string]: FileAsset } = {};

        /**
         * 资源树保存路径
         */
        protected resources = "resource.json";

        /**
         * 构建可读资源系统
         * 
         * @param fs 可读文件系统
         */
        constructor(fs?: ReadFS)
        {
            this._fs = fs;
        }

        /**
         * 初始化
         * 
         * @param callback 完成回调
         */
        init(callback?: () => void)
        {
            this.fs.readObject(this.resources, (err, data: FolderAsset) =>
            {
                if (data)
                {
                    this._root = data;
                    //
                    var assets: FileAsset[] = [data];
                    var index = 0;
                    while (index < assets.length)
                    {
                        var asset = assets[index];
                        // 计算路径
                        var path = asset.name + asset.extenson;
                        if (asset.parentAsset) path = asset.parentAsset.assetPath + "/" + path;
                        asset.assetPath = path;
                        // 新增映射
                        this.idMap[asset.assetId] = asset;
                        this.pathMap[asset.assetPath] = asset;
                        // 
                        if (asset instanceof FolderAsset)
                        {
                            for (var i = 0; i < asset.childrenAssets.length; i++)
                            {
                                var v = asset.childrenAssets[i];
                                // 处理资源父子关系
                                v.parentAsset = asset;
                                //
                                assets.push(v);
                            }
                        }
                        index++;
                    }

                    callback && callback();
                } else
                {
                    this.createAsset(FolderAsset, { name: "Assets" }, null, (err, asset) =>
                    {
                        this._root = asset;
                        callback && callback();
                    });
                }
            });
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
            parent = parent || this._root;
            //
            var asset = new cls();
            asset.assetId = feng3d.FMath.uuid();
            asset.meta = { guid: asset.assetId, mtimeMs: Date.now(), birthtimeMs: Date.now(), assetType: asset.assetType };
            asset.rs = this;
            Object.setValue(asset, value);
            // 设置默认名称
            asset.name = asset.name || "new " + asset.assetType;
            if (parent) 
            {
                // 计算有效名称
                asset.name = this.getValidChildName(parent, asset.name);
                // 处理资源父子关系
                parent.childrenAssets.push(asset);
                asset.parentAsset = parent;
            }
            // 计算路径
            var path = asset.name + asset.extenson;
            if (asset.parentAsset) path = asset.parentAsset.assetPath + "/" + path;
            asset.assetPath = path;
            // 新增映射
            this.idMap[asset.assetId] = asset;
            this.pathMap[asset.assetPath] = asset;
            callback && callback(null, asset);
        }

        /**
         * 获取有效子文件名称
         * 
         * @param parent 父文件夹
         * @param name 名称
         */
        getValidChildName(parent: FolderAsset, name: string)
        {
            var childrenNames = parent.childrenAssets.map(v => v.name);
            var newName = name;
            var index = 1;
            while (childrenNames.indexOf(newName) != -1)
            {
                newName = name + index;
                index++;
            }
            return newName;
        }

        /**
         * 读取文件为资源对象
         * @param id 资源编号
         * @param callback 读取完成回调
         */
        readAsset(id: string, callback: (err: Error, assets: FileAsset) => void)
        {
            var feng3dAsset = this.idMap[id];
            if (!feng3dAsset)
            {
                callback(new Error(`不存在资源 ${id}`), null);
                return;
            }
            if (feng3dAsset.meta)
            {
                callback(null, feng3dAsset);
                return;
            }
            this._readMeta(feng3dAsset.assetPath, (err, meta) =>
            {
                if (err)
                {
                    callback(err, feng3dAsset);
                    return;
                }
                feng3dAsset.meta = meta;
                feng3dAsset["readFile"](this.fs, err =>
                {
                    callback(err, feng3dAsset);
                });
            });
        }

        /**
         * 获取指定类型资源
         * 
         * @param type 资源类型
         */
        getAssetsByType<T extends FileAsset>(type: Constructor<T>): T[]
        {
            var assets = Object.keys(this.idMap).map(v => this.idMap[v]);
            return <any>assets.filter(v => v instanceof type);
        }

        /**
         * 获取指定类型资源数据
         * 
         * @param type 资源类型
         */
        getAssetDatasByType<T extends AssetData>(type: Constructor<T>): T[]
        {
            var assets = Object.keys(this.idMap).map(v => this.idMap[v].data);
            return <any>assets.filter(v => v instanceof type);
        }

        /**
         * 设置默认资源，该类资源不会保存到文件系统中
         * 
         * @param assets 资源
         */
        setDefaultAssetData(assetData: AssetData)
        {
            defaultAssets[assetData.assetId] = assetData;
        }

        /**
         * 获取资源
         * 
         * @param assetId 资源编号
         */
        getAsset(assetId: string)
        {
            return this.idMap[assetId];
        }

        /**
         * 获取资源数据
         * 
         * @param assetId 资源编号
         */
        getAssetData(assetId: string)
        {
            return defaultAssets[assetId] || this.idMap[assetId].data;
        }

        /**
         * 获取所有资源
         */
        getAllAssets()
        {
            var assets = Object.keys(this.idMap).map(v => this.idMap[v]);
            return assets;
        }

        /**
         * 读取资源元标签
         * 
         * @param path 资源路径
         * @param callback 完成回调 
         */
        private _readMeta(path: string, callback?: (err: Error, meta: AssetMeta) => void)
        {
            this.fs.readObject(path + metaSuffix, callback);
        }
    }
    /**
     * 默认资源数据，该类资源不会保存到文件系统中
     */
    var defaultAssets: { [id: string]: AssetData } = {};
    rs = new ReadRS();
}