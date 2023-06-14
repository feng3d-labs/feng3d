import { globalEmitter } from '@feng3d/event';
import { dataTransform } from '../polyfill/DataTransform';
import { FSType } from './FSType';
import { IReadWriteFS } from './IReadWriteFS';
import { _indexedDB } from './base/_IndexedDB';

declare module '@feng3d/event'
{
    interface GlobalEvents
    {
        /**
         * 删除文件
         */
        'fs.delete': string;

        /**
         * 写文件
         */
        'fs.write': string;
    }
}

/**
 * 用于是否为文件夹
 */
const directorytoken = '!!!___directory___!!!';

/**
 * 索引数据文件系统
 */
export class IndexedDBFS implements IReadWriteFS
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

    constructor(DBname = 'feng3d-editor', projectname = 'testproject')
    {
        this.DBname = DBname;
        this.projectname = projectname;
    }

    /**
     * 读取文件
     * @param path 路径
     */
    async readArrayBuffer(path: string)
    {
        const data = await _indexedDB.objectStoreGet(this.DBname, this.projectname, path);
        if (!data)
        {
            return data as ArrayBuffer;
        }

        if (data instanceof ArrayBuffer)
        {
            return data;
        }

        if (data instanceof Object)
        {
            const str = JSON.stringify(data, null, '\t').replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
            const arraybuffer = dataTransform.stringToArrayBuffer(str);

            return arraybuffer;
        }

        const arraybuffer = dataTransform.stringToArrayBuffer(data as string);

        return arraybuffer;
    }

    /**
     * 读取文件
     * @param path 路径
     */
    async readString(path: string)
    {
        const data = await _indexedDB.objectStoreGet(this.DBname, this.projectname, path);

        if (data instanceof ArrayBuffer)
        {
            const str = await dataTransform.arrayBufferToString(data);

            return str;
        }
        if (data instanceof Object)
        {
            const str = JSON.stringify(data, null, '\t').replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');

            return str;
        }

        return data as string;
    }

    /**
     * 读取文件
     * @param path 路径
     */
    async readObject(path: string)
    {
        const data = await _indexedDB.objectStoreGet(this.DBname, this.projectname, path);

        if (data instanceof ArrayBuffer)
        {
            const str = await dataTransform.arrayBufferToString(data);
            const obj = JSON.parse(str);

            return obj;
        }
        if (data instanceof Object)
        {
            return data;
        }
        if (typeof data === 'string')
        {
            const obj = JSON.parse(data as string);

            return obj;
        }

        return data;
    }

    /**
     * 加载图片
     * @param path 图片路径
     */
    async readImage(path: string)
    {
        const data = await this.readArrayBuffer(path);
        if (!data)
        {
            return undefined;
        }
        const img = await dataTransform.arrayBufferToImage(data);

        return img;
    }

    /**
     * 获取文件绝对路径
     * @param path （相对）路径
     */
    getAbsolutePath(path: string)
    {
        return path;
    }

    /**
     * 是否为文件夹
     *
     * @param path 文件路径
     */
    async isDirectory(path: string)
    {
        const data = await this.readString(path);

        return data === directorytoken;
    }

    /**
     * 文件是否存在
     * @param path 文件路径
     */
    async exists(path: string)
    {
        const data = await _indexedDB.objectStoreGet(this.DBname, this.projectname, path);

        return !!data;
    }

    /**
     * 读取文件夹中文件列表
     * @param path 路径
     */
    async readdir(path: string)
    {
        const allfilepaths = await _indexedDB.getAllKeys(this.DBname, this.projectname);
        if (!allfilepaths)
        {
            return;
        }
        const subfilemap = {};

        allfilepaths.forEach((element) =>
        {
            const dirp = path === '' ? path : (`${path}/`);

            if (element.substr(0, dirp.length) === dirp && element !== path)
            {
                const result = element.substr(dirp.length);
                const subfile = result.split('/').shift();

                subfilemap[subfile] = 1;
            }
        });
        const files = Object.keys(subfilemap);

        return files;
    }

    /**
     * 新建文件夹
     * @param path 文件夹路径
     */
    async mkdir(path: string)
    {
        const exists = await this.exists(path);
        if (exists)
        {
            return;
        }
        await _indexedDB.objectStorePut(this.DBname, this.projectname, path, directorytoken);
    }

    /**
     * 删除文件
     * @param path 文件路径
     */
    async deleteFile(path: string)
    {
        // 删除文件
        await _indexedDB.objectStoreDelete(this.DBname, this.projectname, path);
        globalEmitter.emit('fs.delete', path);
    }

    /**
     * 写文件
     * @param path 文件路径
     * @param data 文件数据
     */
    async writeArrayBuffer(path: string, data: ArrayBuffer)
    {
        await _indexedDB.objectStorePut(this.DBname, this.projectname, path, data);
        globalEmitter.emit('fs.write', path);
    }

    /**
     * 写文件
     * @param path 文件路径
     * @param data 文件数据
     */
    async writeString(path: string, data: string)
    {
        await _indexedDB.objectStorePut(this.DBname, this.projectname, path, data);
        globalEmitter.emit('fs.write', path);
    }

    /**
     * 写文件
     * @param path 文件路径
     * @param object 文件数据
     */
    async writeObject(path: string, object: any)
    {
        await _indexedDB.objectStorePut(this.DBname, this.projectname, path, object);
        globalEmitter.emit('fs.write', path);
    }

    /**
     * 写图片
     * @param path 图片路径
     * @param image 图片
     */
    async writeImage(path: string, image: HTMLImageElement)
    {
        const arraybuffer = await dataTransform.imageToArrayBuffer(image);
        await this.writeArrayBuffer(path, arraybuffer);
        globalEmitter.emit('fs.write', path);
    }

    /**
     * 复制文件
     * @param src 源路径
     * @param dest 目标路径
     */
    async copyFile(src: string, dest: string)
    {
        const data = await _indexedDB.objectStoreGet(this.DBname, this.projectname, src);
        if (data)
        {
            await _indexedDB.objectStorePut(this.DBname, this.projectname, dest, data);
        }
    }

    /**
     * 是否存在指定项目
     * @param projectname 项目名称
     */
    async hasProject(projectname: string)
    {
        const objectStoreNames = await _indexedDB.getObjectStoreNames(this.DBname);

        return objectStoreNames.indexOf(projectname) !== -1;
    }

    /**
     * 初始化项目
     * @param projectname 项目名称
     */
    async initproject(projectname: string)
    {
        this.projectname = projectname;
        await _indexedDB.createObjectStore(this.DBname, projectname);

        return projectname;
    }
}

/**
 * 索引数据文件系统
 */
export const indexedDBFS = new IndexedDBFS();
