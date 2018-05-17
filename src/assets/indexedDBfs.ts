namespace feng3d
{
    export var DBname = "feng3d-editor";
    export var projectname = "testproject";

    /**
     * 索引数据资源
     */
    export var indexedDBAssets: IndexedDBAssets;

    /**
     * 索引数据资源
     */
    export class IndexedDBAssets implements IAssets
    {
        loadImage(url: string, callback: (img: HTMLImageElement) => void): void
        {
            indexedDBfs.readFile(url, (err, data) =>
            {
                if (data)
                {
                    dataTransform.arrayBufferToImage(data, callback);
                } else
                {
                    callback(null);
                }
            });
        }
    }

    assetsmap[FSType.indexedDB] = indexedDBAssets = new IndexedDBAssets();

    function copy(sourcekey: string | number, targetkey: string | number, callback?: (err?: Error | null) => void)
    {
        storage.get(DBname, projectname, sourcekey, (err, data) =>
        {
            if (err)
            {
                callback && callback(err);
                return;
            }
            storage.set(DBname, projectname, targetkey, data, callback);
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
            storage.delete(DBname, projectname, sourcekey, callback);
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
            storage.delete(DBname, projectname, <string>deletelists.shift(), (err) =>
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
    export class IndexedDBfs implements FS  
    {
        hasProject(projectname: string, callback: (has: boolean) => void)
        {
            storage.hasObjectStore(DBname, projectname, callback);
        }
        getProjectList(callback: (err: Error | null, projects: string[] | null) => void)
        {
            storage.getObjectStoreNames(DBname, callback)
        }
        initproject(projectname1: string, callback: () => void)
        {
            storage.createObjectStore(DBname, projectname1, (err) =>
            {
                if (err)
                {
                    warn(err);
                    return;
                }
                projectname = projectname1;
                // todo 启动监听 ts代码变化自动编译
                callback();
            });
        }
        //
        stat(path: string, callback: (err: Error | null, stats: FileInfo | null) => void): void
        {
            storage.get(DBname, projectname, path, (err, data) =>
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
        readdir(path: string, callback: (err: Error | null, files: string[] | null) => void): void
        {
            assert(path.charAt(path.length - 1) == "/", `文件夹路径必须以 / 结尾！`)
            storage.getAllKeys(DBname, projectname, (err, allfilepaths) =>
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
        writeFile(path: string, data: ArrayBuffer, callback?: (err: Error | null) => void): void
        {
            storage.set(DBname, projectname, path, { isDirectory: false, birthtime: new Date(), data: data }, callback);
        }
        /**
         * 读取文件为字符串
         */
        readFileAsString(path: string, callback: (err: Error | null, data: string | null) => void): void
        {
            storage.get(DBname, projectname, path, (err, data) =>
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
        /**
         * 读取文件为Buffer
         */
        readFile(path: string, callback: (err: Error | null, data: ArrayBuffer | undefined) => void): void
        {
            storage.get(DBname, projectname, path, (err, data) =>
            {
                callback(null, data ? data.data : null);
            });
        }
        mkdir(path: string, callback: (err: Error | null) => void): void
        {
            assert(path.charAt(path.length - 1) == "/", `文件夹路径必须以 / 结尾！`)
            storage.set(DBname, projectname, path, { isDirectory: true, birthtime: new Date() }, callback);
        }
        rename(oldPath: string, newPath: string, callback: (err: Error | null) => void): void
        {
            storage.getAllKeys(DBname, projectname, (err, allfilepaths) =>
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
            storage.getAllKeys(DBname, projectname, (err, allfilepaths) =>
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
            storage.getAllKeys(DBname, projectname, (err, allfilepaths) =>
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

    export interface FS
    {
        hasProject(projectname: string, callback: (has: boolean) => void): void;
        getProjectList(callback: (err: Error | null, projects: string[] | null) => void): void;
        initproject(projectname: string, callback: () => void): void;
        stat(path: string, callback: (err: Error | null, stats: FileInfo | null) => void): void;
        readdir(path: string, callback: (err: Error | null, files: string[] | null) => void): void;
        writeFile(path: string, data: ArrayBuffer, callback?: ((err: Error | null) => void) | undefined): void;
        /**
         * 读取文件为字符串
         */
        readFileAsString(path: string, callback: (err: Error | null, data: string | null) => void): void;
        /**
         * 读取文件为Buffer
         */
        readFile(path: string, callback: (err: Error | null, data: ArrayBuffer | undefined) => void): void;
        mkdir(path: string, callback: (err: Error | null) => void): void;
        rename(oldPath: string, newPath: string, callback: (err: Error | null) => void): void;
        move(src: string, dest: string, callback?: ((err: Error | null) => void) | undefined): void;
        remove(path: string, callback?: ((err: Error | null) => void) | undefined): void;
        /**
         * 获取文件绝对路径
         */
        getAbsolutePath(path: string, callback: (err: Error | null, absolutePath: string | null) => void): void;
        /**
         * 获取指定文件下所有文件路径列表
         */
        getAllfilepathInFolder(dirpath: string, callback: (err: Error | null, filepaths: string[] | null) => void): void;
    }
}