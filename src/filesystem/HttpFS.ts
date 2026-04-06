import { loader } from './base/Loader';
import { FS } from './FS';
import { FSType } from './FSType';
import { IReadFS } from './IReadFS';

/**
 * Http可读文件系统
 */
export class HttpFS implements IReadFS
{
    /**
     * 根路径
     */
    rootPath = '';

    type = FSType.http;

    constructor(rootPath = '')
    {
        this.rootPath = rootPath;
        if (this.rootPath === '')
        {
            if (typeof document !== 'undefined')
            {
                const url = document.URL.split('?').shift();

                this.rootPath = url.substring(0, url.lastIndexOf('/') + 1);
            }
        }
    }

    /**
     * 读取文件
     * @param path 路径
     */
    async readArrayBuffer(path: string)
    {
        return await loader.loadBinary(this.getAbsolutePath(path));
    }

    /**
     * 读取文件为字符串
     * @param path 路径
     */
    async readString(path: string)
    {
        return await loader.loadText(this.getAbsolutePath(path));
    }

    /**
     * 读取文件为Object
     * @param path 路径
     */
    async readObject(path: string)
    {
        const content = await loader.loadText(this.getAbsolutePath(path));
        const obj = JSON.parse(content);

        return obj;
    }

    /**
     * 加载图片
     * @param path 图片路径
     */
    async readImage(path: string)
    {
        const img: HTMLImageElement = await new Promise((resolve, reject) =>
        {
            const img = new Image();

            img.onload = () =>
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
        return this.rootPath + path;
    }
}

FS.basefs = new HttpFS();

