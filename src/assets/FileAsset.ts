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
         * 所属资源系统
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
         * 缩略图
         */
        private _thumbnail: HTMLImageElement;

        /**
         * 读取资源缩略图标
         * 
         * @param fs 可读资源管理系统
         * @param callback 完成回调
         */
        readThumbnail(fs: ReadFS, callback: (err: Error, image: HTMLImageElement) => void)
        {
            if (this._thumbnail)
            {
                callback(null, this._thumbnail);
                return;
            }
            fs.readImage("assetIcon/" + this.assetId + ".png", (err, image) =>
            {
                this._thumbnail = image;
                callback(err, image);
            });
        }

        /**
         * 读取资源缩略图标
         * 
         * @param fs 可读写资源管理系统
         * @param image 缩略图
         * @param callback 完成回调
         */
        writeThumbnail(fs: ReadWriteFS, image: HTMLImageElement, callback: (err: Error) => void)
        {
            if (this._thumbnail == image)
            {
                callback(null);
                return;
            }
            this._thumbnail = image;
            fs.writeImage("assetIcon/" + this.assetId + ".png", image, callback);
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
    }
}