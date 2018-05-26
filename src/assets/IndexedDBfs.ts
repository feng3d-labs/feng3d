namespace feng3d
{
    /**
     * 索引数据文件系统
     */
    export var indexedDBfs: IndexedDBfs;

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
        readFile(path: string, callback: (err: Error, data: ArrayBuffer) => void)
        {
            storage.get(this.DBname, this.projectname, path, (err, data) =>
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
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        exists(path: string, callback: (exists: boolean) => void): void
        {
            storage.get(this.DBname, this.projectname, path, (err, data) =>
            {
                callback(!!data);
            });
        }

        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        readdir(path: string, callback: (err: Error, files: string[]) => void): void
        {
            storage.getAllKeys(this.DBname, this.projectname, (err, allfilepaths) =>
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
        mkdir(path: string, callback: (err: Error) => void): void
        {
            storage.set(this.DBname, this.projectname, path, new ArrayBuffer(0), callback);
        }

        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        deleteFile(path: string, callback: (err: Error) => void)
        {
            storage.delete(this.DBname, this.projectname, path, callback);
        }

        /**
         * 写文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeFile(path: string, data: ArrayBuffer, callback: (err: Error) => void)
        {
            storage.set(this.DBname, this.projectname, path, data, callback);
        }

        /**
         * 获取所有文件路径
         * @param callback 回调函数
         */
        getAllPaths(callback: (err: Error, allPaths: string[]) => void)
        {
            storage.getAllKeys(this.DBname, this.projectname, callback);
        }
    }

    indexedDBfs = new IndexedDBfs();
}