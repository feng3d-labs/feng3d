namespace feng3d
{
    /**
     * feng3d资源
     */
    export class FileAsset
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
        rs: ReadRS;

        /**
         * 父资源
         */
        parentAsset: FolderAsset;

        /**
         * 资源路径
         */
        assetPath: string;

        /**
         * 资源类型，由具体对象类型决定
         */
        assetType: AssetType;

        /**
         * 文件后缀
         */
        @serialize
        extenson = "";

        /**
         * 资源对象
         */
        data: AssetData;

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
            if (!(this.rs.fs instanceof ReadWriteFS)) return;

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
        protected saveFile(callback?: (err: Error) => void)
        {
            callback && callback(null);
        }

        /**
         * 读取文件
         * @param callback 完成回调
         */
        protected readFile(callback?: (err: Error) => void)
        {
            callback && callback(null);
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