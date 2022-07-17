namespace feng3d
{
    export interface ReadWriteFS
    {
        get fs(): IReadWriteFS;
    }

    /**
     * 可读写文件系统
     *
     * 扩展基础可读写文件系统
     */
    export class ReadWriteFS extends ReadFS
    {
        /**
         * 项目名称（表单名称）
         */
        projectname: string;

        // eslint-disable-next-line @typescript-eslint/no-useless-constructor
        constructor(fs?: IReadWriteFS)
        {
            super(fs);
        }

        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        exists(path: string, callback: (exists: boolean) => void)
        {
            this.fs.exists(path, callback);
        }

        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        readdir(path: string, callback: (err: Error, files: string[]) => void)
        {
            this.fs.readdir(path, callback);
        }

        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        mkdir(path: string, callback?: (err: Error) => void)
        {
            path = pathUtils.normalizeDir(path);

            this.fs.exists(path, (exists) =>
            {
                if (exists)
                {
                    callback && callback(null);

                    return;
                }
                this.fs.mkdir(path, callback);
            });
        }

        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        deleteFile(path: string, callback?: (err: Error) => void)
        {
            this.fs.deleteFile(path, callback);
        }

        /**
         * 写(新建)文件
         * 自动根据文件类型保存为对应结构
         *
         * @param path 文件路径
         * @param arraybuffer 文件数据
         * @param callback 回调函数
         */
        writeFile(path: string, arraybuffer: ArrayBuffer, callback?: (err: Error) => void)
        {
            let ext = pathUtils.extname(path);

            ext = ext.split('.').pop();
            const fileTypedic = { meta: 'txt', json: 'object', jpg: 'arraybuffer', png: 'arraybuffer', mp3: 'arraybuffer', js: 'txt', ts: 'txt', map: 'txt', html: 'txt' };
            let type = fileTypedic[ext];

            if (path === 'tsconfig.json' || path === '.vscode/settings.json')
            {
                type = 'txt';
            }

            if (type === 'txt')
            {
                dataTransform.arrayBufferToString(arraybuffer, (str) =>
                {
                    this.fs.writeString(path, str, (err) =>
                    {
                        callback(err);
                    });
                });
            }
            else if (type === 'object')
            {
                dataTransform.arrayBufferToObject(arraybuffer, (obj) =>
                {
                    this.fs.writeObject(path, obj, (err) =>
                    {
                        callback(err);
                    });
                });
            }
            else if (type === 'arraybuffer')
            {
                this.writeArrayBuffer(path, arraybuffer, (err) =>
                {
                    callback(err);
                });
            }
            else
            {
                console.error(`无法导入文件 ${path}`);
            }
        }

        /**
         * 写ArrayBuffer(新建)文件
         * @param path 文件路径
         * @param arraybuffer 文件数据
         * @param callback 回调函数
         */
        writeArrayBuffer(path: string, arraybuffer: ArrayBuffer, callback?: (err: Error) => void)
        {
            // 如果所属文件夹不存在则新建
            const dirpath = pathUtils.dirname(path);

            this.mkdir(dirpath, (err) =>
            {
                if (err)
                {
                    callback && callback(err);

                    return;
                }
                this.fs.writeArrayBuffer(path, arraybuffer, callback);
            });
        }

        /**
         * 写字符串到(新建)文件
         * @param path 文件路径
         * @param str 文件数据
         * @param callback 回调函数
         */
        writeString(path: string, str: string, callback?: (err: Error) => void)
        {
            // 如果所属文件夹不存在则新建
            const dirpath = pathUtils.dirname(path);

            this.mkdir(dirpath, (err) =>
            {
                if (err)
                {
                    callback && callback(err);

                    return;
                }
                this.fs.writeString(path, str, callback);
            });
        }

        /**
         * 写Object到(新建)文件
         * @param path 文件路径
         * @param object 文件数据
         * @param callback 回调函数
         */
        writeObject(path: string, object: any, callback?: (err: Error) => void)
        {
            // 如果所属文件夹不存在则新建
            const dirpath = pathUtils.dirname(path);

            this.mkdir(dirpath, (err) =>
            {
                if (err)
                {
                    callback && callback(err);

                    return;
                }
                this.fs.writeObject(path, object, callback);
            });
        }

        /**
         * 写图片
         * @param path 图片路径
         * @param image 图片
         * @param callback 回调函数
         */
        writeImage(path: string, image: HTMLImageElement, callback?: (err: Error) => void)
        {
            // 如果所属文件夹不存在则新建
            const dirpath = pathUtils.dirname(path);

            this.mkdir(dirpath, (err) =>
            {
                if (err)
                {
                    callback && callback(err);

                    return;
                }
                this.fs.writeImage(path, image, callback);
            });
        }

        /**
         * 复制文件
         * @param src 源路径
         * @param dest 目标路径
         * @param callback 回调函数
         */
        copyFile(src: string, dest: string, callback?: (err: Error) => void)
        {
            this.fs.copyFile(src, dest, callback);
        }

        /**
         * 是否为文件夹
         *
         * @param path 文件路径
         * @param callback 完成回调
         */
        isDirectory(path: string, callback: (result: boolean) => void)
        {
            this.fs.isDirectory(path, callback);
        }

        /**
         * 初始化项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        initproject(projectname: string, callback: (err: Error) => void)
        {
            this.fs.initproject(projectname, callback);
        }

        /**
         * 是否存在指定项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        hasProject(projectname: string, callback: (has: boolean) => void)
        {
            this.fs.hasProject(projectname, callback);
        }

        /**
         * 获取指定文件下所有文件路径列表
         */
        getAllPathsInFolder(dirpath = '', callback: (err: Error, filepaths: string[]) => void): void
        {
            const dirs = [dirpath];
            const result = [];
            let currentdir = '';

            // 递归获取文件
            const handle = () =>
            {
                if (dirs.length > 0)
                {
                    currentdir = dirs.shift();
                    this.readdir(currentdir, (_err, files) =>
                    {
                        // 获取子文件路径
                        const getChildPath = () =>
                        {
                            if (files.length === 0)
                            {
                                handle();

                                return;
                            }
                            const childpath = currentdir + (currentdir === '' ? '' : '/') + files.shift();

                            result.push(childpath);
                            this.isDirectory(childpath, (result) =>
                            {
                                if (result) dirs.push(childpath);
                                getChildPath();
                            });
                        };

                        getChildPath();
                    });
                }
                else
                {
                    callback(null, result);
                }
            };

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
                const deletelists = movelists.reduce((value: string[], current) =>
                {
                    value.push(current[0]);

                    return value;
                }, []);

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
                const copyitem: [string, string] = copylists.shift();

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
                this.deleteFile(deletelists.shift(), (err) =>
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
            this.isDirectory(oldPath, (result) =>
            {
                if (result)
                {
                    this.getAllPathsInFolder(oldPath, (err, filepaths) =>
                    {
                        if (err)
                        {
                            callback && callback(err);

                            return;
                        }
                        const renamelists: [string, string][] = [[oldPath, newPath]];

                        filepaths.forEach((element) =>
                        {
                            renamelists.push([element, element.replace(oldPath, newPath)]);
                        });
                        this.moveFiles(renamelists, callback);
                    });
                }
                else
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
            this.isDirectory(path, (result) =>
            {
                if (result)
                {
                    this.getAllPathsInFolder(path, (err, filepaths) =>
                    {
                        if (err)
                        {
                            callback && callback(err);

                            return;
                        }
                        const removelists: string[] = filepaths.concat(path);

                        this.deleteFiles(removelists, callback);
                    });
                }
                else
                {
                    this.deleteFile(path, callback);
                }
            });
        }
    }
}