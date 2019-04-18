namespace feng3d
{
    /**
     * feng3d资源
     */
    export abstract class FileAsset
    {
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
            debuger && console.assert(!!this.assetPath);
            var ext = pathUtils.getExtension(this.assetPath);
            return ext;
        }

        /**
         * 父资源
         */
        parentAsset: FolderAsset;

        /**
         * 文件名称
         * 
         * 不包含后缀
         */
        get fileName()
        {
            debuger && console.assert(!!this.assetPath);
            var fn = pathUtils.getName(this.assetPath);
            return fn;
        }

        /**
         * 资源路径
         */
        @serialize
        assetPath: string;

        /**
         * 资源对象
         */
        data: AssetData;

        /**
         * 创建资源对象
         */
        abstract createData(): void;

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
            event.once(this, eventtype, () => { callback(); });
            if (this.isLoading) return;
            this.isLoading = true;
            this.readMeta((err) =>
            {
                if (err)
                {
                    event.dispatch(this, eventtype);
                    return;
                }
                this.readFile((err) =>
                {
                    event.dispatch(this, eventtype);
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
                    // 删除父子资源关系
                    if (this.parentAsset)
                    {
                        this.parentAsset.childrenAssets.delete(this);
                        this.parentAsset = null;
                    }
                    // 删除映射
                    delete this.rs.idMap[this.assetId];
                    delete this.rs.pathMap[this.assetPath];

                    callback && callback();
                });
            });
        }

        /**
         * 读取资源缩略图标
         * 
         * @param callback 完成回调
         */
        readThumbnail(callback: (err: Error, image: HTMLImageElement) => void)
        {
            if (this._thumbnail)
            {
                callback(null, this._thumbnail);
                return;
            }
            this.rs.fs.readImage(this.thumbnailPath, (err, image) =>
            {
                this._thumbnail = image;
                callback(err, image);
            });
        }

        /**
         * 读取资源缩略图标
         * 
         * @param image 缩略图
         * @param callback 完成回调
         */
        writeThumbnail(image: HTMLImageElement, callback?: (err: Error) => void)
        {
            if (this._thumbnail == image)
            {
                callback && callback(null);
                return;
            }
            this._thumbnail = image;
            this.rs.fs.writeImage(this.thumbnailPath, image, callback);
        }

        /**
         * 删除资源缩略图标
         * 
         * @param callback 完成回调
         */
        deleteThumbnail(callback?: (err: Error) => void)
        {
            this.rs.fs.deleteFile(this.thumbnailPath, callback);
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
                if (this.rs.getAsset(this.assetId) == null)
                {
                    this.deleteThumbnail();
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
         * 缩略图
         */
        private _thumbnail: HTMLImageElement;

        /**
         * 缩略图路径
         */
        private get thumbnailPath()
        {
            return "assetIcons/" + this.assetId + ".png";
        }
    }
}