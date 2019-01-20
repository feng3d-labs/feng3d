namespace feng3d
{
    /**
     * 索引数据文件系统
     */
    export var indexedDBfs: IndexedDBfs;

    /**
     * 文件（夹）状态文件后缀
     */
    const statSuffix = ".__stat";

    /**
     * 索引数据文件系统
     */
    export class IndexedDBfs implements ReadWriteFS
    {
        get type()
        {
            return FSType.indexedDB;
        }

        /**
         * 数据库名称
         */
        DBname: string;

        /**
         * 项目名称（表单名称）
         */
        projectname: string;

        constructor(DBname = "feng3d-editor", projectname = "testproject")
        {
            this.DBname = DBname;
            this.projectname = projectname;
        }

        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readArrayBuffer(path: string, callback: (err: Error, data: ArrayBuffer) => void)
        {
            _indexedDB.objectStoreGet(this.DBname, this.projectname, path, (err, data) =>
            {
                callback(err, data);
            });
        }

        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        getAbsolutePath(path: string, callback: (err: Error, absolutePath: string) => void): void
        {
            callback(null, path);
        }

        /**
         * 获取文件状态。
         * 
         * @param path 文件的路径。
         * @param callback 完成回调。
         */
        stat(path: string, callback: (err: Error, stats: FileStats) => void): void
        {
            _indexedDB.objectStoreGet(this.DBname, this.projectname, path + statSuffix, (err, data: FileStats) =>
            {
                callback(err, data);
            });
        }

        /**
         * 写（更新）文件状态信息
         * 
         * @param path 文件路径
         * @param stats 状态信息
         * @param callback 完成回调
         */
        private _writeStats(path: string, stats: FileStats, callback: (err: Error) => void)
        {
            _indexedDB.objectStorePut(this.DBname, this.projectname, path + statSuffix, stats, callback);
        }

        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        exists(path: string, callback: (exists: boolean) => void): void
        {
            this.stat(path, (err, stats) =>
            {
                callback(!!stats);
            });
        }

        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        readdir(path: string, callback: (err: Error, files: string[]) => void): void
        {
            this.getAllPaths((err, allfilepaths) =>
            {
                if (!allfilepaths)
                {
                    callback(err, null);
                    return;
                }
                var subfilemap = {};
                allfilepaths.forEach(element =>
                {
                    if (element.substr(0, path.length) == path && element != path)
                    {
                        var result = element.substr(path.length);
                        var index = result.indexOf("/");
                        if (index != -1)
                            result = result.substring(0, index + 1);
                        subfilemap[result] = 1;
                    }
                });
                var files = Object.keys(subfilemap);
                callback(null, files);
            });
        }

        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        mkdir(path: string, callback?: (err: Error) => void): void
        {
            this.exists(path, (exists) =>
            {
                if (exists)
                {
                    callback(new Error(`文件夹${path}已存在无法新建`));
                    return;
                }
                // 写状态文件
                this._writeStats(path, { isDirectory: true, birthtimeMs: Date.now(), mtimeMs: Date.now(), size: 0 }, (err) =>
                {
                    if (err)
                    {
                        callback && callback(err);
                        return;
                    }
                    _indexedDB.objectStorePut(this.DBname, this.projectname, path, new ArrayBuffer(0), callback);
                });
            });
        }

        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        deleteFile(path: string, callback: (err: Error) => void)
        {
            // 删除状态文件
            _indexedDB.objectStoreDelete(this.DBname, this.projectname, path + statSuffix, (err) =>
            {
                // 删除文件
                _indexedDB.objectStoreDelete(this.DBname, this.projectname, path, callback);
            });
        }

        /**
         * 写文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeArrayBuffer(path: string, data: ArrayBuffer, callback?: (err: Error) => void)
        {
            this.stat(path, (err, stats) =>
            {
                if (!stats)
                {
                    stats = { isDirectory: false, birthtimeMs: Date.now(), mtimeMs: Date.now(), size: 0 }
                }
                stats.size = data.byteLength;
                stats.mtimeMs = Date.now();
                this._writeStats(path, stats, (err) =>
                {
                    if (err)
                    {
                        callback && callback(err);
                        return;
                    }
                    _indexedDB.objectStorePut(this.DBname, this.projectname, path, data, callback);
                });
            });
        }

        /**
         * 获取所有文件路径
         * @param callback 回调函数
         */
        getAllPaths(callback: (err: Error, allPaths: string[]) => void)
        {
            _indexedDB.getAllKeys(this.DBname, this.projectname, (err, allPaths) =>
            {
                if (err)
                {
                    callback(err, allPaths);
                    return;
                }
                // 除去状态描述文件
                var paths = allPaths.filter(v => v.substr(-statSuffix.length) != statSuffix);
                callback(err, paths);
            });
        }
    }

    indexedDBfs = new IndexedDBfs();
}