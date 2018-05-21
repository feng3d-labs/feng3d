namespace feng3d
{
    /**
     * 文件系统类型
     */
    export enum FSType
    {
        http = "http",
        native = "native",
        indexedDB = "indexedDB"
    }

    /**
     * 资源系统
     */
    export var assets: ReadAssets;

    /**
     * 资源
     * 在可读文件系统上进行加工，比如把读取数据转换为图片或者文本
     */
    export class ReadAssets implements ReadFS
    {
        /**
         * 可读文件系统
         */
        fs: ReadFS = httpFS;

        get type()
        {
            return this.fs.type;
        }

        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFile(path: string, callback: (err, data: ArrayBuffer) => void)
        {
            var readFS = this.fs;
            if (path.indexOf("http://") != -1
                || path.indexOf("https://") != -1
            )
                readFS = httpFS;
            if (path.indexOf("file:///") != -1
                || path.indexOf("file:///") != -1
            )
                readFS = httpFS;

            readFS.readFile(path, callback);
        }

        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        getAbsolutePath(path: string, callback: (err: Error, absolutePath: string) => void): void
        {
            this.fs.getAbsolutePath(path, callback);
        }

        /**
         * 读取文件为字符串
         */
        readFileAsString(path: string, callback: (err: Error | null, data: string | null) => void): void
        {
            this.readFile(path, (err, data) =>
            {
                if (err)
                {
                    callback(err, null);
                    return;
                }
                dataTransform.arrayBufferToString(data, (content) =>
                {
                    callback(null, content);
                });
            });
        }

        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        readFileAsImage(path: string, callback: (err: Error, img: HTMLImageElement) => void)
        {
            if (path == "" || path == null) 
            {
                callback(new Error("无效路径!"), null);
                return;
            }
            this.readFile(path, (err, data) =>
            {
                if (err)
                {
                    callback(err, null);
                    return;
                }
                dataTransform.arrayBufferToImage(data, (img) =>
                {
                    callback(null, img);
                });
            });
        }
    }

    assets = new ReadAssets();

    export class ReadWriteAssets extends ReadAssets implements ReadWriteFS
    {
        /**
         * 可读写文件系统
         */
        fs: ReadWriteFS = indexedDBfs;
        // fs = indexedDBfs;

        get projectname()
        {
            return this.fs.projectname;
        }
        set projectname(v)
        {
            this.fs.projectname = v;
        }

        constructor(readWriteFS?: ReadWriteFS)
        {
            super();
            if (readWriteFS)
                this.fs = <any>readWriteFS;
        }

        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        exists(path: string, callback: (exists: boolean) => void): void
        {
            this.fs.exists(path, callback);
        }

        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        readdir(path: string, callback: (err: Error, files: string[]) => void): void
        {
            assert(this.isDir(path), `文件夹路径必须以 / 结尾！`)
            this.fs.readdir(path, callback);
        }

        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        mkdir(path: string, callback: (err: Error) => void): void
        {
            assert(this.isDir(path), `文件夹路径必须以 / 结尾！`)
            this.fs.mkdir(path, callback);
        }

        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        deleteFile(path: string, callback: (err: Error) => void)
        {
            this.fs.deleteFile(path, callback);
        }

        /**
         * 写文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeFile(path: string, data: ArrayBuffer, callback: (err: Error) => void)
        {
            if (this.isDir(path))
            {
                this.fs.mkdir(path, callback);
            } else
            {
                this.fs.writeFile(path, data, callback);
            }
        }

        ///--------------------------

        /**
         * 获取所有文件路径
         * @param callback 回调函数
         */
        getAllPaths(callback: (err: Error, allPaths: string[]) => void)
        {
            this.getAllfilepathInFolder("", callback);
        }

        /**
         * 获取指定文件下所有文件路径列表
         */
        getAllfilepathInFolder(dirpath: string, callback: (err: Error, filepaths: string[]) => void): void
        {
            assert(this.isDir(dirpath), `文件夹路径必须以 / 结尾！`)

            var dirs = [dirpath];
            var result = [];
            var currentdir = "";

            // 递归获取文件
            var handle = () =>
            {
                if (dirs.length > 0)
                {
                    currentdir = dirs.shift();
                    this.readdir(currentdir, (err, files) =>
                    {
                        files.forEach(element =>
                        {
                            var childpath = currentdir + element;
                            result.push(childpath);
                            if (this.isDir(childpath))
                                dirs.push(childpath);
                        });
                        handle();
                    });
                } else
                {
                    callback(null, result);
                }
            }
            handle();
        }

        /**
         * 复制文件
         * @param src    源路径
         * @param dest    目标路径
         * @param callback 回调函数
         */
        copyFile(src: string, dest: string, callback: (err: Error) => void)
        {
            this.readFile(src, (err, data) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }
                this.writeFile(dest, data, callback);
            });
        }

        /**
         * 移动文件
         * @param src 源路径
         * @param dest 目标路径
         * @param callback 回调函数
         */
        moveFile(src: string, dest: string, callback: (err: Error) => void)
        {
            this.copyFile(src, dest, (err) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }
                this.deleteFile(src, callback);
            });
        }

        /**
         * 重命名文件
         * @param oldPath 老路径
         * @param newPath 新路径
         * @param callback 回调函数
         */
        renameFile(oldPath: string, newPath: string, callback: (err: Error) => void): void
        {
            this.moveFile(oldPath, newPath, callback);
        }

        /**
         * 移动一组文件
         * @param movelists 移动列表
         * @param callback 回调函数
         */
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

        /**
         * 复制一组文件
         * @param copylists 复制列表
         * @param callback 回调函数
         */
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

        /**
         * 删除一组文件
         * @param deletelists 删除列表
         * @param callback 回调函数
         */
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

        /**
         * 重命名文件(夹)
         * @param oldPath 老路径
         * @param newPath 新路径
         * @param callback 回调函数
         */
        rename(oldPath: string, newPath: string, callback: (err: Error) => void): void
        {
            if (this.isDir(oldPath))
            {
                this.getAllfilepathInFolder(oldPath, (err, filepaths) =>
                {
                    if (err)
                    {
                        callback(err);
                        return;
                    }
                    var renamelists: [string, string][] = [[oldPath, newPath]];
                    filepaths.forEach(element =>
                    {
                        renamelists.push([element, element.replace(oldPath, newPath)]);
                    });
                    this.moveFiles(renamelists, callback);
                });
            } else
            {
                this.renameFile(oldPath, newPath, callback);
            }
        }

        /**
         * 移动文件(夹)
         * @param src 源路径
         * @param dest 目标路径
         * @param callback 回调函数
         */
        move(src: string, dest: string, callback: (err: Error) => void): void
        {
            this.rename(src, dest, callback);
        }

        /**
         * 删除文件(夹)
         * @param path 路径
         * @param callback 回调函数
         */
        delete(path: string, callback: (err: Error) => void): void
        {
            if (this.isDir(path))
            {
                this.getAllfilepathInFolder(path, (err, filepaths) =>
                {
                    if (err)
                    {
                        callback && callback(err);
                        return;
                    }
                    var removelists: string[] = filepaths.concat(path);
                    this.deleteFiles(removelists, callback);
                });
            } else
            {
                this.deleteFile(path, callback);
            }
        }

        /**
         * 是否为文件夹
         * @param path 文件路径
         */
        isDir(path: string)
        {
            if (path == "") return true;
            return path.charAt(path.length - 1) == "/";
        }
    }

    /**
     * 可读文件系统
     */
    export interface ReadFS
    {
        /**
         * 文件系统类型
         */
        readonly type: FSType;
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFile(path: string, callback: (err, data: ArrayBuffer) => void);

        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        getAbsolutePath(path: string, callback: (err: Error, absolutePath: string) => void): void
    }

    /**
     * 可读写文件系统
     */
    export interface ReadWriteFS extends ReadFS
    {
        /**
         * 项目名称
         */
        projectname: string

        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        exists(path: string, callback: (exists: boolean) => void): void;

        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        readdir(path: string, callback: (err: Error, files: string[]) => void): void;

        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        mkdir(path: string, callback: (err: Error) => void): void;

        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        deleteFile(path: string, callback: (err) => void): void;

        /**
         * 写(新建)文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeFile(path: string, data: ArrayBuffer, callback: (err: Error) => void): void;
    }
}