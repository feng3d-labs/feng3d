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

        private _status = { isiniting: false, isinit: false };

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
            if (this._status.isinit) { callback && callback(); return; }

            var eventtype = "init";
            event.once(this, eventtype, () => { callback && callback(); });
            if (this._status.isiniting) return;
            this._status.isiniting = true;

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
                        // 设置资源系统
                        asset.rs = <any>this;
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
                    event.dispatch(this, eventtype);
                } else
                {
                    this.createAsset(FolderAsset, "Assets", null, null, (err, asset) =>
                    {
                        this._root = asset;
                        event.dispatch(this, eventtype);
                    });
                }
            });
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
            parent = parent || this._root;
            //
            var asset: FileAsset = new cls();
            var assetId = feng3d.FMath.uuid()

            // 初始化
            asset.rs = <any>this;
            asset.assetId = assetId;
            asset.createData();
            asset.meta = { guid: assetId, mtimeMs: Date.now(), birthtimeMs: Date.now(), assetType: asset.assetType };

            serialization.setValue(<T>asset, value);

            //
            var extenson = pathUtils.getExtension(fileName);
            fileName = pathUtils.getName(fileName);

            // 设置默认名称
            fileName = fileName || "new " + asset.assetType;
            if (parent) 
            {
                // 计算有效名称
                fileName = this.getValidChildName(parent, fileName);
                // 处理资源父子关系
                parent.childrenAssets.push(asset);
                asset.parentAsset = parent;
            }
            // 计算路径
            if (extenson == "") extenson = cls["extenson"];
            debuger && console.assert(extenson != undefined, `对象 ${cls} 没有设置 extenson 值，参考 FolderAsset.extenson`);
            var path = fileName + extenson;
            if (asset.parentAsset) path = asset.parentAsset.assetPath + "/" + path;
            asset.assetPath = path;
            // 新增映射
            this.idMap[asset.assetId] = asset;
            this.pathMap[asset.assetPath] = asset;

            //
            asset.write((err) =>
            {
                callback && callback(null, <T>asset);
            });
        }

        /**
         * 获取有效子文件名称
         * 
         * @param parent 父文件夹
         * @param fileName 文件名称
         */
        getValidChildName(parent: FolderAsset, fileName: string)
        {
            var childrenNames = parent.childrenAssets.map(v => v.fileName);
            var newName = fileName;
            var index = 1;
            while (childrenNames.indexOf(newName) != -1)
            {
                newName = fileName + index;
                index++;
            }
            return newName;
        }

        private _assetStatus: { [id: string]: { isLoaded: boolean, isLoading: boolean } } = {};

        /**
         * 读取文件为资源对象
         * @param id 资源编号
         * @param callback 读取完成回调
         */
        readAsset(id: string, callback: (err: Error, asset: FileAsset) => void)
        {
            var asset = this.idMap[id];
            if (!asset)
            {
                callback(new Error(`不存在资源 ${id}`), asset);
                return;
            }
            asset.read((err) =>
            {
                callback(err, asset);
            });
        }

        /**
         * 读取资源数据
         * 
         * @param id 资源编号
         * @param callback 完成回调
         */
        readAssetData(id: string, callback: (err: Error, data: AssetData) => void)
        {
            if (defaultAssets[id])
            {
                callback(null, defaultAssets[id]);
                return;
            }
            this.readAsset(id, (err, asset) =>
            {
                callback(err, asset && asset.data);
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
            var defaults = Object.keys(defaultAssets).map(v => defaultAssets[v]);
            var assets = Object.keys(this.idMap).map(v => this.idMap[v].data);
            assets = defaults.concat(assets);
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
            return defaultAssets[assetId] || (this.idMap[assetId] && this.idMap[assetId].data);
        }

        /**
         * 获取所有资源
         */
        getAllAssets()
        {
            var assets = Object.keys(this.idMap).map(v => this.idMap[v]);
            return assets;
        }
    }
    /**
     * 默认资源数据，该类资源不会保存到文件系统中
     */
    var defaultAssets: { [id: string]: AssetData } = {};
    rs = new ReadRS();
}