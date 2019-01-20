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
        fs: ReadWriteFS;

        constructor(readWriteFS: ReadWriteFS = indexedDBFS)
        {
            super();
            this.fs = readWriteFS;
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
                    this.fs.readdir(currentdir, (err, files) =>
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
            this.fs.copyFile(src, dest, (err) =>
            {
                if (err)
                {
                    callback && callback(err);
                    return;
                }
                this.fs.deleteFile(src, callback);
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
                this.fs.copyFile(copyitem[0], copyitem[1], (err) =>
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
                this.fs.deleteFile(<string>deletelists.shift(), (err) =>
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
                this.fs.deleteFile(path, callback);
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