namespace feng3d
{
    export function getAssetTypeClass<K extends keyof AssetTypeClassMap>(type: K)
    {
        return assetTypeClassMap[type];
    }

    export function setAssetTypeClass<K extends keyof AssetTypeClassMap>(type: K, cls: AssetTypeClassMap[K])
    {
        assetTypeClassMap[type] = cls;
    }

    export interface AssetTypeClassMap
    {
    }
    export const assetTypeClassMap: AssetTypeClassMap = <any>{};

    /**
     * feng3d资源
     */
    export abstract class FileAsset
    {
        /**
         * 资源路径
         */
        @serialize
        assetPath: string;

        /**
         * 资源编号
         */
        @serialize
        assetId: string;

        /**
         * 资源元标签，该对象也用来判断资源是否被加载，值为null表示未加载，否则已加载。
         * 
         * 并且该对象还会用于存储主文件无法存储的数据，比如 TextureAsset 中存储了 Texture2D 信息
         */
        meta: AssetMeta;

        /**
         * 资源系统
         * 
         * 加载或者创建该资源的资源系统
         */
        rs: ReadWriteRS;

        /**
         * 资源类型，由具体对象类型决定
         */
        assetType: AssetType;

        /**
         * 是否已加载
         */
        isLoaded = false;

        /**
         * 是否正在加载中
         */
        isLoading = false

        /**
         * 文件后缀
         */
        get extenson()
        {
            console.assert(!!this.assetPath);
            var ext = pathUtils.extname(this.assetPath);
            return ext;
        }

        /**
         * 父资源
         */
        get parentAsset()
        {
            var dir = pathUtils.dirname(this.assetPath);
            var parent = this.rs.getAssetByPath(dir) as FolderAsset;
            return parent;
        }

        /**
         * 文件名称
         * 
         * 不包含后缀
         */
        get fileName()
        {
            console.assert(!!this.assetPath);
            var fn = pathUtils.getName(this.assetPath);
            return fn;
        }

        /**
         * 资源对象
         */
        data: any;

        /**
         * 初始化资源
         */
        initAsset()
        {
        }

        /**
         * 获取资源数据
         * 
         * @param callback 完成回调，当资源已加载时会立即调用回调，否则在资源加载完成后调用。
         */
        getAssetData(callback?: (result: any) => void)
        {
            if (!this.isLoaded)
            {
                if (callback)
                {
                    this.read(err =>
                    {
                        console.assert(!err);
                        this.getAssetData(callback);
                    });
                }
                return null;
            }
            var assetData = this._getAssetData();
            callback && callback(assetData);
            return assetData;
        }

        /**
         * 资源已加载时获取资源数据，内部使用
         */
        protected _getAssetData()
        {
            return this.data;
        }

        /**
         * 读取资源
         * 
         * @param callback 完成回调
         */
        read(callback: (err?: Error) => void)
        {
            if (this.isLoaded)
            {
                callback();
                return;
            }
            var eventtype = "loaded";
            event.once(this, eventtype, () =>
            {
                this.isLoaded = true;
                this.isLoading = false;
                callback();
            });
            if (this.isLoading) return;
            this.isLoading = true;
            this.readMeta((err) =>
            {
                if (err)
                {
                    event.emit(this, eventtype);
                    return;
                }
                this.readFile((err) =>
                {
                    event.emit(this, eventtype);
                });
            });
        }

        /**
         * 写入资源
         * 
         * @param callback 完成回调
         */
        write(callback?: (err: Error) => void)
        {
            this.meta.mtimeMs = Date.now();
            this.writeMeta((err) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }
                this.saveFile(err =>
                {
                    callback && callback(err);
                });
            });
        }

        /**
         * 删除资源
         * 
         * @param callback 完成回调
         */
        delete(callback?: (err?: Error) => void)
        {
            // 删除 meta 文件
            this.deleteMeta((err) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }
                this.deleteFile((err) =>
                {
                    // 删除映射
                    rs.deleteAssetById(this.assetId);
                    callback && callback();
                });
            });
        }

        /**
         * 读取资源预览图标
         * 
         * @param callback 完成回调
         */
        readPreview(callback: (err: Error, image: HTMLImageElement) => void)
        {
            if (this._preview)
            {
                callback(null, this._preview);
                return;
            }
            this.rs.fs.readImage(this.previewPath, (err, image) =>
            {
                this._preview = image;
                callback(err, image);
            });
        }

        /**
         * 读取资源预览图标
         * 
         * @param image 预览图
         * @param callback 完成回调
         */
        writePreview(image: HTMLImageElement, callback?: (err: Error) => void)
        {
            if (this._preview == image)
            {
                callback && callback(null);
                return;
            }
            this._preview = image;
            this.rs.fs.writeImage(this.previewPath, image, callback);
        }

        /**
         * 删除资源预览图标
         * 
         * @param callback 完成回调
         */
        deletePreview(callback?: (err: Error) => void)
        {
            this.rs.fs.deleteFile(this.previewPath, callback);
        }

        /**
         * 读取文件
         * 
         * @param callback 完成回调
         */
        abstract readFile(callback?: (err: Error) => void): void;

        /**
         * 保存文件
         * 
         * @param callback 完成回调
         */
        abstract saveFile(callback?: (err: Error) => void): void;

        /**
         * 删除文件
         * 
         * @param callback 完成回调
         */
        protected deleteFile(callback?: (err: Error) => void)
        {
            this.rs.fs.deleteFile(this.assetPath, callback);

            // 延迟一帧判断该资源是否被删除，排除移动文件时出现的临时删除情况
            ticker.once(1000, () =>
            {
                if (this.rs.getAssetById(this.assetId) == null)
                {
                    this.deletePreview();
                }
            });
        }

        /**
         * 元标签路径
         */
        protected get metaPath()
        {
            return this.assetPath + ".meta";
        }

        /**
         * 读取元标签
         * 
         * @param callback 完成回调 
         */
        protected readMeta(callback?: (err?: Error) => void)
        {
            this.rs.fs.readObject(this.metaPath, (err, meta: AssetMeta) =>
            {
                this.meta = meta;
                callback && callback(err);
            });
        }

        /**
         * 写元标签
         * 
         * @param callback 完成回调
         */
        protected writeMeta(callback?: (err: Error) => void)
        {
            this.rs.fs.writeObject(this.metaPath, this.meta, callback);
        }

        /**
         * 删除元标签
         * 
         * @param callback 完成回调
         */
        protected deleteMeta(callback?: (err: Error) => void)
        {
            this.rs.fs.deleteFile(this.metaPath, callback);
        }

        /**
         * 预览图
         */
        private _preview: HTMLImageElement;

        /**
         * 预览图路径
         */
        private get previewPath()
        {
            return "previews/" + this.assetId + ".png";
        }
    }

}