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
         * 名称
         */
        @oav()
        @serialize
        name = "";

        /**
         * 资源元标签
         */
        meta: AssetMeta;

        /**
         * 资源系统
         * 
         * 加载或者创建该资源的资源系统
         */
        readonly rs: ReadWriteRS;

        /**
         * 资源类型，由具体对象类型决定
         */
        readonly assetType: AssetType;

        /**
         * 文件后缀
         */
        @serialize
        readonly extenson: string = "";

        /**
         * 父资源
         */
        parentAsset: FolderAsset;

        /**
         * 资源路径
         */
        assetPath: string;

        /**
         * 资源对象
         */
        data: AssetData;

        constructor(rs: ReadWriteRS)
        {
            this.rs = rs;
        }

        /**
         * 读取资源
         * 
         * @param callback 完成回调
         */
        read(callback: (err: Error) => void)
        {
            if (this.meta)
            {
                callback(null);
                return;
            }
            this._readMeta((err) =>
            {
                if (err)
                {
                    callback(err);
                    return;
                }
                this.readFile(callback);
            });
        }

        /**
         * 写入资源
         * 
         * @param callback 完成回调
         */
        write(callback: (err: Error) => void)
        {
            this.meta.mtimeMs = Date.now();
            this._writeMeta((err) =>
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
         * 保存文件
         * @param callback 完成回调
         */
        protected abstract saveFile(callback?: (err: Error) => void): void;

        /**
         * 读取文件
         * @param callback 完成回调
         */
        protected abstract readFile(callback?: (err: Error) => void): void;

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

        /**
         * 元标签路径
         */
        private get metaPath()
        {
            return this.assetPath + metaSuffix;
        }

        /**
         * 读取资源元标签
         * 
         * @param path 资源路径
         * @param callback 完成回调 
         */
        private _readMeta(callback?: (err?: Error) => void)
        {
            this.rs.fs.readObject(this.metaPath, (err, meta) =>
            {
                this.meta = <any>meta;
                callback(err);
            });
        }

        /**
         * 写资源元标签
         * 
         * @param callback 完成回调
         */
        private _writeMeta(callback?: (err: Error) => void)
        {
            this.rs.fs.writeObject(this.assetPath + metaSuffix, this.meta, callback);
        }
    }
}