namespace feng3d
{
    /**
     * 资源数据
     */
    export interface IAssetData
    {
        /**
         * 资源编号
         */
        assetsId: string;
    }

    /**
     * feng3d资源
     */
    export class FileAsset extends Feng3dObject
    {
        /**
         * 资源编号
         */
        @serialize
        assetsId: string;

        /**
         * 名称
         */
        @oav()
        @serialize
        name = "";

        /**
         * 资源元标签
         */
        meta: AssetsMeta;

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
        assetsPath: string;

        /**
         * 资源类型，由具体对象类型决定
         */
        assetType: AssetExtension;

        /**
         * 文件后缀
         */
        @serialize
        extenson = "";

        /**
         * 资源对象
         */
        data: IAssetData;

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
            fs.readImage("assetsIcon/" + this.assetsId + ".png", (err, image) =>
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
            fs.writeImage("assetsIcon/" + this.assetsId + ".png", image, callback);
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