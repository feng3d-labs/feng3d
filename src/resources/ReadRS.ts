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
        get fs() { return this._fs; }
        private _fs: ReadFS;

        /**
         * 根文件夹
         */
        get root() { return this._root; }
        private _root: Feng3dFolder;

        /**
         * 资源编号映射
         */
        idMap: { [id: string]: Feng3dAssets } = {};

        /**
         * 资源路径映射
         */
        pathMap: { [path: string]: Feng3dAssets } = {};

        constructor(fs: ReadFS)
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
            this._fs.readObject(resource, (err, data: Feng3dFolder) =>
            {
                if (data)
                {
                    this._root = data;
                    //
                    var assets: Feng3dAssets[] = [data];
                    var index = 0;
                    while (index < assets.length)
                    {
                        var asset = assets[index];
                        // 计算路径
                        var path = asset.name + asset.extenson;
                        if (asset.parentAsset) path = asset.parentAsset.assetsPath + "/" + path;
                        asset._assetsPath = path;
                        // 新增映射
                        this.idMap[asset.assetsId] = asset;
                        this.pathMap[asset._assetsPath] = asset;
                        // 
                        if (asset instanceof Feng3dFolder)
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
                    this.createAsset(Feng3dFolder, { name: "Assets" }, null, (err, asset) =>
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
        createAsset<T extends Feng3dAssets>(cls: new () => T, value: gPartial<T>, parent: Feng3dFolder, callback: (err: Error, asset: T) => void)
        {
            parent = parent || this._root;
            //
            var asset = new cls();
            asset.meta = { guid: feng3d.FMath.uuid(), mtimeMs: Date.now(), birthtimeMs: Date.now(), assetType: asset.assetType };
            asset.rs = this;
            Object.setValue(asset, value);
            // 设置默认名称
            asset.name = asset.name || "new " + asset.assetType;
            if (parent) 
            {
                // 计算有效名称
                var childrenNames = parent.childrenAssets.map(v => v.name);
                var baseName = asset.name;
                var newName = baseName;
                var index = 1;
                while (childrenNames.indexOf(newName) != -1)
                {
                    newName = baseName + index;
                }
                asset.name = newName;
                // 处理资源父子关系
                parent.childrenAssets.push(asset);
                asset.parentAsset = parent;
            }
            // 计算路径
            var path = asset.name + asset.extenson;
            if (asset.parentAsset) path = asset.parentAsset.assetsPath + "/" + path;
            asset._assetsPath = path;
            // 新增映射
            this.idMap[asset.assetsId] = asset;
            this.pathMap[asset._assetsPath] = asset;
            callback(null, asset);
        }
    }
    var resource = "resource.json";
    rs = new ReadRS(fs);
}