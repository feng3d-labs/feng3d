namespace feng3d
{
    /**
     * 可读写资源文件系统
     */
    export class ReadWriteAssetsFS extends ReadAssetsFS
    {
        /**
         * 可读写文件系统
         */
        get fs() { return this._fs; }
        protected _fs: ReadWriteFS;

        constructor(readWriteFS: IBaseReadWriteFS = indexedDBFS)
        {
            super(readWriteFS);
            this._fs = new ReadWriteFS(readWriteFS);
        }

        /**
         * 写（保存）资源
         * 
         * @param assets 资源对象
         * @param callback 完成回调
         */
        writeAssets(assets: Feng3dAssets, callback: (err: Error) => void)
        {
            var path = assetsIDPathMap.getPath(assets.assetsId);
            this.fs.writeObject(path, assets, callback);
        }

        deleteAssets(assets: Feng3dAssets, callback?: (err: Error) => void)
        {
            var path = assetsIDPathMap.getPath(assets.assetsId);
            this.fs.deleteFile(path, callback);
        }
    }
}