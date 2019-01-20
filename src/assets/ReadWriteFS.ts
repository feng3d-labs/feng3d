namespace feng3d
{
    /**
     * 可读写文件系统
     * 
     * 扩展基础可读写文件系统
     */
    export class ReadWriteFS extends ReadFS implements IBaseReadWriteFS
    {
        get projectname()
        {
            return this._fs.projectname;
        }

        set projectname(v)
        {
            this._fs.projectname = v;
        }

        /**
         * 基础文件系统
         */
        get baseFS() { return this._fs; }
        protected _fs: IBaseReadWriteFS;

        constructor(baseReadWriteFS: IBaseReadWriteFS)
        {
            super(baseReadWriteFS);
            this._fs = baseReadWriteFS;
        }

        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        exists(path: string, callback: (exists: boolean) => void): void
        {
            this._fs.exists(path, callback);
        }

        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        readdir(path: string, callback: (err: Error, files: string[]) => void): void
        {
            this._fs.readdir(path, callback);
        }

        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        mkdir(path: string, callback?: (err: Error) => void): void
        {
            this._fs.mkdir(path, callback);
        }

        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        deleteFile(path: string, callback?: (err: Error) => void): void
        {
            this._fs.deleteFile(path, callback);
        }

        /**
         * 写ArrayBuffer(新建)文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeArrayBuffer(path: string, data: ArrayBuffer, callback?: (err: Error) => void): void
        {
            this._fs.writeArrayBuffer(path, data, callback);
        }

        /**
         * 写字符串到(新建)文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeString(path: string, data: string, callback?: (err: Error) => void): void
        {
            this._fs.writeString(path, data, callback);
        }

        /**
         * 写Object到(新建)文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeObject(path: string, data: Object, callback?: (err: Error) => void): void
        {
            this._fs.writeObject(path, data, callback);
        }

        /**
         * 写图片
         * @param path 图片路径
         * @param image 图片
         * @param callback 回调函数
         */
        writeImage(path: string, image: HTMLImageElement, callback: (err: Error) => void)
        {
            this._fs.writeImage(path, image, callback);
        }

        /**
         * 复制文件
         * @param src    源路径
         * @param dest    目标路径
         * @param callback 回调函数
         */
        copyFile(src: string, dest: string, callback?: (err: Error) => void)
        {
            this._fs.copyFile(src, dest, callback);
        }


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
                    this._fs.readdir(currentdir, (err, files) =>
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
         * 移动文件
         * @param src 源路径
         * @param dest 目标路径
         * @param callback 回调函数
         */
        moveFile(src: string, dest: string, callback?: (err: Error) => void)
        {
            this._fs.copyFile(src, dest, (err) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }
                this._fs.deleteFile(src, callback);
            });
        }

        /**
         * 重命名文件
         * @param oldPath 老路径
         * @param newPath 新路径
         * @param callback 回调函数
         */
        renameFile(oldPath: string, newPath: string, callback?: (err: Error) => void): void
        {
            this.moveFile(oldPath, newPath, callback);
        }

        /**
         * 移动一组文件
         * @param movelists 移动列表
         * @param callback 回调函数
         */
        moveFiles(movelists: [string, string][], callback?: (err: Error) => void)
        {
            this.copyFiles(movelists.concat(), (err) =>
            {
                if (err)
                {
                    callback && callback(err);
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
        copyFiles(copylists: [string, string][], callback?: (err: Error) => void)
        {
            if (copylists.length > 0)
            {
                var copyitem: [string, string] = <any>copylists.shift();
                this._fs.copyFile(copyitem[0], copyitem[1], (err) =>
                {
                    if (err)
                    {
                        callback && callback(err);
                        return;
                    }
                    this.copyFiles(copylists, callback);
                });
                return;
            }
            callback && callback(null);
        }

        /**
         * 删除一组文件
         * @param deletelists 删除列表
         * @param callback 回调函数
         */
        deleteFiles(deletelists: string[], callback?: (err: Error) => void)
        {
            if (deletelists.length > 0)
            {
                this._fs.deleteFile(<string>deletelists.shift(), (err) =>
                {
                    if (err)
                    {
                        callback && callback(err);
                        return;
                    }
                    this.deleteFiles(deletelists, callback);
                });
                return;
            }
            callback && callback(null);
        }

        /**
         * 重命名文件(夹)
         * @param oldPath 老路径
         * @param newPath 新路径
         * @param callback 回调函数
         */
        rename(oldPath: string, newPath: string, callback?: (err: Error) => void): void
        {
            if (this.isDir(oldPath))
            {
                this.getAllfilepathInFolder(oldPath, (err, filepaths) =>
                {
                    if (err)
                    {
                        callback && callback(err);
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
         * 
         * @param src 源路径
         * @param dest 目标路径
         * @param callback 回调函数
         */
        move(src: string, dest: string, callback?: (err?: Error) => void): void
        {
            this.rename(src, dest, callback);
        }

        /**
         * 删除文件(夹)
         * @param path 路径
         * @param callback 回调函数
         */
        delete(path: string, callback?: (err: Error) => void): void
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
                this._fs.deleteFile(path, callback);
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
}