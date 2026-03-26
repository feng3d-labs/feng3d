import { path as fengpath } from '@feng3d/path';
import { dataTransform } from '@feng3d/polyfill';
import { IReadWriteFS } from './IReadWriteFS';
import { ReadFS } from './ReadFS';

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
    get projectname()
    {
        return this.fs.projectname;
    }

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(fs?: IReadWriteFS)
    {
        super(fs);
    }

    /**
     * 文件是否存在
     * @param path 文件路径
     */
    async exists(path: string)
    {
        const exists = await this.fs.exists(path);

        return exists;
    }

    /**
     * 读取文件夹中文件列表
     * @param path 路径
     */
    async readdir(path: string)
    {
        const files = await this.fs.readdir(path);

        return files;
    }

    /**
     * 新建文件夹
     * @param path 文件夹路径
     */
    async mkdir(path: string)
    {
        path = fengpath.resolve(path);
        const exists = await this.fs.exists(path);
        if (exists)
        {
            return;
        }
        await this.fs.mkdir(path);
    }

    /**
     * 删除文件
     * @param path 文件路径
     */
    async deleteFile(path: string)
    {
        await this.fs.deleteFile(path);
    }

    /**
     * 写(新建)文件
     * 自动根据文件类型保存为对应结构
     *
     * @param path 文件路径
     * @param arraybuffer 文件数据
     */
    async writeFile(path: string, arraybuffer: ArrayBuffer)
    {
        let ext = fengpath.extname(path);

        ext = ext.split('.').pop();
        const fileTypedic = { meta: 'txt', json: 'object', jpg: 'arraybuffer', png: 'arraybuffer', mp3: 'arraybuffer', js: 'txt', ts: 'txt', map: 'txt', html: 'txt' };
        let type = fileTypedic[ext];

        if (path === 'tsconfig.json' || path === '.vscode/settings.json')
        {
            type = 'txt';
        }

        if (type === 'txt')
        {
            const str = await dataTransform.arrayBufferToString(arraybuffer);
            await this.fs.writeString(path, str);

            return;
        }
        if (type === 'object')
        {
            const obj = await dataTransform.arrayBufferToObject(arraybuffer);
            await this.fs.writeObject(path, obj);

            return;
        }
        if (type === 'arraybuffer')
        {
            await this.writeArrayBuffer(path, arraybuffer);
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
     */
    async writeArrayBuffer(path: string, arraybuffer: ArrayBuffer)
    {
        // 如果所属文件夹不存在则新建
        const dirpath = fengpath.dirname(path);
        await this.mkdir(dirpath);
        await this.fs.writeArrayBuffer(path, arraybuffer);
    }

    /**
     * 写字符串到(新建)文件
     * @param path 文件路径
     * @param str 文件数据
     */
    async writeString(path: string, str: string)
    {
        // 如果所属文件夹不存在则新建
        const dirpath = fengpath.dirname(path);
        await this.mkdir(dirpath);
        await this.fs.writeString(path, str);
    }

    /**
     * 写Object到(新建)文件
     * @param path 文件路径
     * @param object 文件数据
     */
    async writeObject(path: string, object: any)
    {
        // 如果所属文件夹不存在则新建
        const dirpath = fengpath.dirname(path);
        await this.mkdir(dirpath);
        await this.fs.writeObject(path, object);
    }

    /**
     * 写图片
     * @param path 图片路径
     * @param image 图片
     */
    async writeImage(path: string, image: HTMLImageElement)
    {
        // 如果所属文件夹不存在则新建
        const dirpath = fengpath.dirname(path);
        await this.mkdir(dirpath);
        await this.fs.writeImage(path, image);
    }

    /**
     * 复制文件
     * @param src 源路径
     * @param dest 目标路径
     */
    async copyFile(src: string, dest: string)
    {
        await this.fs.copyFile(src, dest);
    }

    /**
     * 是否为文件夹
     *
     * @param path 文件路径
     */
    async isDirectory(path: string)
    {
        return await this.fs.isDirectory(path);
    }

    /**
     * 初始化项目
     * @param projectname 项目名称
     */
    async initproject(projectname: string)
    {
        return await this.fs.initproject(projectname);
    }

    /**
     * 是否存在指定项目
     * @param projectname 项目名称
     */
    async hasProject(projectname: string)
    {
        return await this.fs.hasProject(projectname);
    }

    /**
     * 获取指定文件下所有文件路径列表
     */
    async getAllPathsInFolder(dirpath = '')
    {
        const dirs = [dirpath];
        const result: string[] = [];
        let currentdir = '';

        while (dirs.length > 0)
        {
            currentdir = dirs.shift();
            const files = await this.readdir(currentdir);
            for (let i = 0; i < files.length; i++)
            {
                const childpath = currentdir + (currentdir === '' ? '' : '/') + files[i];
                result.push(childpath);
                const isDirectory = await this.isDirectory(childpath);
                if (isDirectory) dirs.push(childpath);
            }
        }

        return result;
    }

    /**
     * 移动文件
     * @param src 源路径
     * @param dest 目标路径
     */
    async moveFile(src: string, dest: string)
    {
        await this.copyFile(src, dest);
        await this.deleteFile(src);
    }

    /**
     * 重命名文件
     * @param oldPath 老路径
     * @param newPath 新路径
     */
    async renameFile(oldPath: string, newPath: string)
    {
        await this.moveFile(oldPath, newPath);
    }

    /**
     * 移动一组文件
     * @param movelists 移动列表
     */
    async moveFiles(movelists: [string, string][])
    {
        await this.copyFiles(movelists.concat());
        const deletelists = movelists.map((value) => value[0]);
        await this.deleteFiles(deletelists);
    }

    /**
     * 复制一组文件
     * @param copylists 复制列表
     */
    async copyFiles(copylists: [string, string][])
    {
        await Promise.all(copylists.map((copyitem) => this.copyFile(copyitem[0], copyitem[1])));
    }

    /**
     * 删除一组文件
     * @param deletelists 删除列表
     */
    async deleteFiles(deletelists: string[])
    {
        await Promise.all(deletelists.map((v) => this.deleteFile(v)));
    }

    /**
     * 重命名文件(夹)
     * @param oldPath 老路径
     * @param newPath 新路径
     */
    async rename(oldPath: string, newPath: string)
    {
        const result = await this.isDirectory(oldPath);
        if (result)
        {
            const filepaths = await this.getAllPathsInFolder(oldPath);
            const renamelists: [string, string][] = [[oldPath, newPath]];

            filepaths.forEach((element) =>
            {
                renamelists.push([element, element.replace(oldPath, newPath)]);
            });
            await this.moveFiles(renamelists);
        }
        else
        {
            await this.renameFile(oldPath, newPath);
        }
    }

    /**
     * 移动文件(夹)
     *
     * @param src 源路径
     * @param dest 目标路径
     */
    async move(src: string, dest: string)
    {
        await this.rename(src, dest);
    }

    /**
     * 删除文件(夹)
     * @param path 路径
     */
    async delete(path: string)
    {
        const result = await this.isDirectory(path);
        if (result)
        {
            const filepaths = await this.getAllPathsInFolder(path);
            const removelists: string[] = filepaths.concat(path);
            await this.deleteFiles(removelists);
        }
        else
        {
            await this.deleteFile(path);
        }
    }
}
