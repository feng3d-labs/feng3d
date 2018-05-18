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
                callback(null, data ? data.data : null);
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
         * 获取文件信息
         * @param path 文件路径
         * @param callback 回调函数
         */
        stat(path: string, callback: (err: Error, stats: FileInfo) => void): void
        {
            storage.get(this.DBname, this.projectname, path, (err, data) =>
            {
                if (data)
                {
                    callback(null, {
                        path: path,
                        birthtime: data.birthtime.getTime(),
                        mtime: data.birthtime.getTime(),
                        isDirectory: data.isDirectory,
                        size: 0
                    });
                }
                else
                {
                    callback(new Error(path + " 不存在"), null);
                }
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
            storage.set(this.DBname, this.projectname, path, { isDirectory: true, birthtime: new Date() }, callback);
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
        writeFile(path: string, data: ArrayBuffer, callback?: (err: Error) => void)
        {
            storage.set(this.DBname, this.projectname, path, { isDirectory: false, birthtime: new Date(), data: data }, callback);
        }

        /**
         * 获取所有文件路径
         * @param callback 回调函数
         */
        getAllPaths(callback: (err: Error, allPaths: string[]) => void)
        {
            storage.getAllKeys(this.DBname, this.projectname, callback);
        }

        ///---------------------------

        copyFile(sourcekey: string, targetkey: string, callback: (err: Error) => void)
        {
            storage.get(indexedDBfs.DBname, indexedDBfs.projectname, sourcekey, (err, data) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }
                storage.set(indexedDBfs.DBname, indexedDBfs.projectname, targetkey, data, callback);
            });
        }

        moveFile(sourcekey: string, targetkey: string, callback: (err: Error) => void)
        {
            this.copyFile(sourcekey, targetkey, (err) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }
                this.deleteFile(sourcekey, callback);
            });
        }

        moveFiles(movelists: [string, string][], callback: (err: Error) => void)
        {
            this.copyFiles(movelists.concat(), (err) =>
            {
                if (err)
                {
                    callback(err);
                    return;
                }
                var deletelists = movelists.reduce((value: string[], current) => { value.push(current[0]); return value; }, [])
                this.deleteFiles(deletelists, callback);
            });
        }

        copyFiles(copylists: [string, string][], callback: (err: Error) => void)
        {
            if (copylists.length > 0)
            {
                var copyitem: [string, string] = <any>copylists.shift();
                this.copyFile(copyitem[0], copyitem[1], (err) =>
                {
                    if (err)
                    {
                        callback(err);
                        return;
                    }
                    this.copyFiles(copylists, callback);
                });
                return;
            }
            callback(null);
        }

        deleteFiles(deletelists: string[], callback: (err: Error) => void)
        {
            if (deletelists.length > 0)
            {
                this.deleteFile(<string>deletelists.shift(), (err) =>
                {
                    if (err)
                    {
                        callback(err);
                        return;
                    }
                    this.deleteFiles(deletelists, callback);
                });
                return;
            }
            callback(null);
        }

        rename(oldPath: string, newPath: string, callback: (err: Error) => void): void
        {
            this.getAllPaths((err, allfilepaths) =>
            {
                if (!allfilepaths)
                {
                    callback(err);
                    return;
                }
                var renamelists: [string, string][] = [[oldPath, newPath]];
                allfilepaths.forEach(element =>
                {
                    var result = new RegExp(oldPath + "\\b").exec(element);
                    if (result != null && result.index == 0 && element != oldPath)
                    {
                        renamelists.push([element, element.replace(oldPath, newPath)]);
                    }
                });
                this.moveFiles(renamelists, callback);
            });
        }

        move(src: string, dest: string, callback: (err: Error) => void): void
        {
            this.rename(src, dest, callback);
        }

        remove(path: string, callback: (err: Error) => void): void
        {
            this.getAllPaths((err, allfilepaths) =>
            {
                if (!allfilepaths)
                {
                    callback && callback(err);
                    return;
                }
                var removelists: string[] = [path];
                allfilepaths.forEach(element =>
                {
                    var result = new RegExp(path + "\\b").exec(element);
                    if (result != null && result.index == 0)
                    {
                        removelists.push(element);
                    }
                });
                this.deleteFiles(removelists, callback);
            });
        }
    }

    indexedDBfs = new IndexedDBfs();

    export type FileInfo = { path: string, birthtime: number, mtime: number, isDirectory: boolean, size: number };
}