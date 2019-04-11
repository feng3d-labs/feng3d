namespace feng3d
{
    /**
     * 可读写文件系统
     * 
     * 扩展基础可读写文件系统
     */
    export abstract class ReadWriteFS extends ReadFS
    {
        /**
         * 项目名称（表单名称）
         */
        projectname: string;

        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        abstract exists(path: string, callback: (exists: boolean) => void): void;

        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        abstract readdir(path: string, callback: (err: Error, files: string[]) => void): void;

        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        abstract mkdir(path: string, callback?: (err: Error) => void): void;

        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        abstract deleteFile(path: string, callback?: (err: Error) => void): void;

        /**
         * 写ArrayBuffer(新建)文件
         * @param path 文件路径
         * @param arraybuffer 文件数据
         * @param callback 回调函数
         */
        abstract writeArrayBuffer(path: string, arraybuffer: ArrayBuffer, callback?: (err: Error) => void): void;

        /**
         * 写字符串到(新建)文件
         * @param path 文件路径
         * @param str 文件数据
         * @param callback 回调函数
         */
        abstract writeString(path: string, str: string, callback?: (err: Error) => void): void;

        /**
         * 写Object到(新建)文件
         * @param path 文件路径
         * @param object 文件数据
         * @param callback 回调函数
         */
        abstract writeObject(path: string, object: Object, callback?: (err: Error) => void): void;

        /**
         * 写图片
         * @param path 图片路径
         * @param image 图片
         * @param callback 回调函数
         */
        abstract writeImage(path: string, image: HTMLImageElement, callback?: (err: Error) => void): void;

        /**
         * 复制文件
         * @param src    源路径
         * @param dest    目标路径
         * @param callback 回调函数
         */
        abstract copyFile(src: string, dest: string, callback?: (err: Error) => void): void

        /**
         * 是否为文件夹
         *
         * @param path 文件路径
         * @param callback 完成回调
         */
        abstract isDirectory(path: string, callback: (result: boolean) => void): void;

        /**
         * 初始化项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        abstract initproject(projectname: string, callback: (err: Error) => void): void;

        /**
         * 是否存在指定项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        abstract hasProject(projectname: string, callback: (has: boolean) => void): void;

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
                        // 获取子文件路径
                        var getChildPath = () =>
                        {
                            if (files.length == 0)
                            {
                                handle();
                                return;
                            }
                            var childpath = currentdir + (currentdir == "" ? "" : "/") + files.shift();
                            result.push(childpath);
                            this.isDirectory(childpath, result =>
                            {
                                if (result) dirs.push(childpath);
                                getChildPath();
                            });
                        };
                        getChildPath();
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
                this.copyFile(copyitem[0], copyitem[1], (err) =>
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
                this.deleteFile(<string>deletelists.shift(), (err) =>
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
            this.isDirectory(oldPath, result =>
            {
                if (result)
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
            });
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
            this.isDirectory(path, result =>
            {
                if (result)
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
            });
        }
    }
}