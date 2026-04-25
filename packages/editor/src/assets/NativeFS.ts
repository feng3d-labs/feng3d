import { dataTransform, FSType, globalEmitter, IReadWriteFS } from 'feng3d';
import { nativeAPI, NativeFSBase, supportNative } from './NativeRequire';

/**
 * 本地文件系统
 * 注意：native 功能已移至独立的 workspace 子项目 @feng3d-editor/native
 */
export const nativeFS1: NativeFSBase = null;

/**
 * 本地文件系统
 */
export class NativeFS implements IReadWriteFS
{
    /**
     * 项目路径
     */
    projectname: string;

    /**
     * 文件系统类型
     */
    readonly type = FSType.native;

    fs: NativeFSBase;

    constructor(fs: NativeFSBase)
    {
        this.fs = fs;
    }

    /**
     * 读取文件为ArrayBuffer
     * @param path 路径
     */
    async readArrayBuffer(path: string)
    {
        const realPath = this.getAbsolutePath(path);
        const arraybuffer = await this.fs.readFile(realPath);

        return arraybuffer;
    }

    /**
     * 读取文件为字符串
     * @param path 路径
     */
    async readString(path: string)
    {
        const data = await this.readArrayBuffer(path);
        const content = await dataTransform.arrayBufferToString(data);

        return content;
    }

    /**
     * 读取文件为Object
     * @param path 路径
     */
    async readObject(path: string)
    {
        const buffer = await this.readArrayBuffer(path);
        const content = await dataTransform.arrayBufferToObject(buffer);

        return content;
    }

    /**
     * 加载图片
     * @param path 图片路径
     */
    async readImage(path: string)
    {
        const exists = await this.exists(path);
        if (!exists)
        {
            return null;
        }
        const img: HTMLImageElement = await new Promise((resolve, reject) =>
        {
            const img = new Image();
            img.onload = function ()
            {
                resolve(img);
            };
            img.onerror = (_evt) =>
            {
                reject(new Error(`加载图片${path}失败`));
            };
            img.src = this.getAbsolutePath(path);
        });

        return img;
    }

    /**
     * 获取文件绝对路径
     * @param path （相对）路径
     */
    getAbsolutePath(path: string)
    {
        if (!this.projectname)
        {
            console.error(`请先使用 initproject 初始化项目`);
        }

        return `${this.projectname}/${path}`;
    }

    /**
     * 文件是否存在
     * @param path 文件路径
     */
    async exists(path: string)
    {
        const realPath = this.getAbsolutePath(path);

        return await this.fs.exists(realPath);
    }

    /**
     * 是否为文件夹
     *
     * @param path 文件路径
     */
    async isDirectory(path: string)
    {
        const realPath = this.getAbsolutePath(path);

        return await this.fs.isDirectory(realPath);
    }

    /**
     * 读取文件夹中文件列表
     *
     * @param path 路径
     */
    async readdir(path: string)
    {
        const realPath = this.getAbsolutePath(path);

        return await this.fs.readdir(realPath);
    }

    /**
     * 新建文件夹
     * @param path 文件夹路径
     */
    async mkdir(path: string)
    {
        const realPath = this.getAbsolutePath(path);
        await this.fs.mkdir(realPath);
    }

    /**
     * 删除文件
     * @param path 文件路径
     */
    async deleteFile(path: string)
    {
        const realPath = this.getAbsolutePath(path);
        const result = await this.isDirectory(path);
        if (result)
        {
            await this.fs.rmdir(realPath);
        }
        else
        {
            await this.fs.deleteFile(realPath);
        }
        globalEmitter.emit('fs.delete', path);
    }

    /**
     * 写ArrayBuffer(新建)文件
     * @param path 文件路径
     * @param arraybuffer 文件数据
     */
    async writeArrayBuffer(path: string, arraybuffer: ArrayBuffer)
    {
        const realPath = this.getAbsolutePath(path);
        await this.fs.writeFile(realPath, arraybuffer);
        globalEmitter.emit('fs.write', path);
    }

    /**
     * 写字符串到(新建)文件
     * @param path 文件路径
     * @param str 文件数据
     */
    async writeString(path: string, str: string)
    {
        const buffer = dataTransform.stringToArrayBuffer(str);
        await this.writeArrayBuffer(path, buffer);
        globalEmitter.emit('fs.write', path);
    }

    /**
     * 写Object到(新建)文件
     * @param path 文件路径
     * @param object 文件数据
     */
    async writeObject(path: string, object: Object)
    {
        const str = JSON.stringify(object, null, '\t').replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
        await this.writeString(path, str);
        globalEmitter.emit('fs.write', path);
    }

    /**
     * 写图片
     * @param path 图片路径
     * @param image 图片
     */
    async writeImage(path: string, image: HTMLImageElement)
    {
        const buffer = await dataTransform.imageToArrayBuffer(image);
        await this.writeArrayBuffer(path, buffer);
        globalEmitter.emit('fs.write', path);
    }

    /**
     * 复制文件
     * @param src    源路径
     * @param dest    目标路径
     */
    async copyFile(src: string, dest: string)
    {
        const buffer = await this.readArrayBuffer(src);
        await this.writeArrayBuffer(dest, buffer);
    }

    /**
     * 是否存在指定项目
     * @param projectname 项目名称
     */
    async hasProject(projectname: string)
    {
        return await this.fs.exists(projectname);
    }

    /**
     * 初始化项目
     * @param projectname 项目名称
     */
    async initproject(projectname: string)
    {
        const exists = await this.fs.exists(projectname);
        if (exists)
        {
            this.projectname = projectname;

            return;
        }
        const path = await nativeAPI.selectDirectoryDialog();
        this.projectname = path;

        return path;
    }
}

export const nativeFS = new NativeFS(nativeFS1);
