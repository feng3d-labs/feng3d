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
         * 构建可读写资源系统
         * 
         * @param fs 可读写文件系统
         */
        constructor(fs: ReadWriteFS)
        {
            super(fs);
        }

        /**
         * 新建资源
         * 
         * @param cls 资源类定义
         * @param value 初始数据
         * @param parent 所在文件夹，如果值为null时默认添加到根文件夹中
         * @param callback 完成回调函数
         */
        createAsset<T extends Feng3dAssets>(cls: new () => T, value?: gPartial<T>, parent?: Feng3dFolder, callback?: (err: Error, asset: T) => void)
        {
            super.createAsset(cls, value, parent, (err, asset) =>
            {
                if (asset)
                {
                    Feng3dAssets.writeAssets(this.fs, asset, (err) =>
                    {
                        callback && callback(err, asset);
                    });
                } else
                {
                    callback && callback(err, null);
                }
            });
        }
    }
}