import { FS } from './FS';
import { FSType } from './FSType';
import { IReadFS } from './IReadFS';

/**
 * 可读文件系统
 */
export class ReadFS
{
    /**
     * 基础文件系统
     */
    get fs() { return this._fs || FS.basefs; }
    set fs(v) { this._fs = v; }
    protected _fs: IReadFS;

    /**
     * 文件系统类型
     */
    get type(): FSType
    {
        return this.fs.type;
    }

    constructor(fs?: IReadFS)
    {
        this.fs = fs;
    }

    /**
     * 读取文件为ArrayBuffer
     * @param path 路径
     */
    async readArrayBuffer(path: string)
    {
        const arraybuffer = await this.fs.readArrayBuffer(path);

        return arraybuffer;
    }

    /**
     * 读取文件为字符串
     * @param path 路径
     */
    async readString(path: string)
    {
        const str = await this.fs.readString(path);

        return str;
    }

    /**
     * 读取文件为Object
     * @param path 路径
     */
    async readObject(path: string)
    {
        const obj = await this.fs.readObject(path);

        return obj;
    }

    /**
     * 加载图片
     * @param path 图片路径
     */
    async readImage(path: string)
    {
        return await this.fs.readImage(path);
    }

    /**
     * 获取文件绝对路径
     * @param path （相对）路径
     */
    getAbsolutePath(path: string)
    {
        return this.fs.getAbsolutePath(path);
    }

    /**
     * 读取文件列表为字符串列表
     *
     * @param paths 路径
     */
    async readStrings(paths: string[])
    {
        return await Promise.all(paths.map((path) => this.readString(path)));
    }

    protected _images: { [path: string]: HTMLImageElement } = {};

    private _state: { [eventtype: string]: true } = {};
}

FS.fs = new ReadFS();

