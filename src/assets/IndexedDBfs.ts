namespace feng3d
{
    /**
     * 索引数据资源
     */
    export var indexedDBReadFS: IndexedDBReadFS;

    /**
     * 索引数据资源
     */
    export class IndexedDBReadFS implements ReadFS
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
    }

    indexedDBReadFS = new IndexedDBReadFS();

    function copy(sourcekey: string | number, targetkey: string | number, callback?: (err?: Error | null) => void)
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

    function move(sourcekey: string | number, targetkey: string | number, callback?: (err?: Error) => void)
    {
        copy(sourcekey, targetkey, (err) =>
        {
            if (err)
            {
                callback && callback(err);
                return;
            }
            storage.delete(indexedDBfs.DBname, indexedDBfs.projectname, sourcekey, callback);
        });
    }

    function movefiles(movelists: [string, string][], callback: (err: Error | null) => void)
    {
        copyfiles(movelists.concat(), (err) =>
        {
            if (err)
            {
                callback(err);
                return;
            }
            var deletelists = movelists.reduce((value: string[], current) => { value.push(current[0]); return value; }, [])
            deletefiles(deletelists, callback);
        });
    }

    function copyfiles(copylists: [string, string][], callback: (err: Error | null) => void)
    {
        if (copylists.length > 0)
        {
            var copyitem: [string, string] = <any>copylists.shift();
            copy(copyitem[0], copyitem[1], (err) =>
            {
                if (err)
                {
                    callback(err);
                    return;
                }
                copyfiles(copylists, callback);
            });
            return;
        }
        callback(null);
    }

    function deletefiles(deletelists: string[], callback: (err: Error | null) => void)
    {
        if (deletelists.length > 0)
        {
            storage.delete(indexedDBfs.DBname, indexedDBfs.projectname, <string>deletelists.shift(), (err) =>
            {
                if (err)
                {
                    callback(err);
                    return;
                }
                deletefiles(deletelists, callback);
            });
            return;
        }
        callback(null);
    }

    /**
     * 索引数据文件系统
     */
    export var indexedDBfs: IndexedDBfs;

    /**
     * 索引数据文件系统
     */
    export class IndexedDBfs extends IndexedDBReadFS implements ReadWriteFS
    {
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

        ///---------------------------


        hasProject(projectname: string, callback: (has: boolean) => void)
        {
            storage.hasObjectStore(this.DBname, projectname, callback);
        }
        getProjectList(callback: (err: Error | null, projects: string[] | null) => void)
        {
            storage.getObjectStoreNames(this.DBname, callback)
        }
        initproject(projectname1: string, callback: () => void)
        {
            storage.createObjectStore(this.DBname, projectname1, (err) =>
            {
                if (err)
                {
                    warn(err);
                    return;
                }
                this.projectname = projectname1;
                // todo 启动监听 ts代码变化自动编译
                callback();
            });
        }
        //
        stat(path: string, callback: (err: Error | null, stats: FileInfo | null) => void): void
        {
            storage.get(this.DBname, this.projectname, path, (err, data) =>
            {
                if (data)
                {
                    callback(err, {
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
         * 读取文件为字符串
         */
        readFileAsString(path: string, callback: (err: Error | null, data: string | null) => void): void
        {
            storage.get(this.DBname, this.projectname, path, (err, data) =>
            {
                path
                if (err)
                {
                    callback(err, null);
                    return;
                }
                var str = dataTransform.arrayBufferToString(<ArrayBuffer>data.data, (content) =>
                {
                    callback(null, content);
                });
            });
        }
        mkdir(path: string, callback: (err: Error | null) => void): void
        {
            assert(path.charAt(path.length - 1) == "/", `文件夹路径必须以 / 结尾！`)
            storage.set(this.DBname, this.projectname, path, { isDirectory: true, birthtime: new Date() }, callback);
        }
        rename(oldPath: string, newPath: string, callback: (err: Error | null) => void): void
        {
            storage.getAllKeys(this.DBname, this.projectname, (err, allfilepaths) =>
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
                    if (result != null && result.index == 0)
                    {
                        renamelists.push([element, element.replace(oldPath, newPath)]);
                    }
                });
                movefiles(renamelists, callback);
            });
        }
        move(src: string, dest: string, callback?: (err: Error | null) => void): void
        {
            this.rename(src, dest, callback || (() => { }));
        }
        remove(path: string, callback?: (err: Error | null) => void): void
        {
            storage.getAllKeys(this.DBname, this.projectname, (err, allfilepaths) =>
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
                deletefiles(removelists, callback || (() => { }));
            });
        }
        /**
         * 获取文件绝对路径
         */
        getAbsolutePath(path: string, callback: (err: Error | null, absolutePath: string | null) => void): void
        {
            callback(null, null);
        }
        /**
         * 获取指定文件下所有文件路径列表
         */
        getAllfilepathInFolder(dirpath: string, callback: (err: Error | null, filepaths: string[] | null) => void): void
        {
            storage.getAllKeys(this.DBname, this.projectname, (err, allfilepaths) =>
            {
                if (!allfilepaths)
                {
                    callback(err, null);
                    return;
                }
                var files: string[] = [];
                allfilepaths.forEach(element =>
                {
                    var result = new RegExp(dirpath + "\\b").exec(element);
                    if (result != null && result.index == 0)
                    {
                        files.push(element);
                    }
                });
                callback(null, files);
            });
        }
    }

    indexedDBfs = new IndexedDBfs();

    export type FileInfo = { path: string, birthtime: number, mtime: number, isDirectory: boolean, size: number };
}