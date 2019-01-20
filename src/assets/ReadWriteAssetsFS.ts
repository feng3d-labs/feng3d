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
    }
}