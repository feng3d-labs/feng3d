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
    get fs(): IReadFS { return this._fs || FS.basefs; }
    set fs(v: IReadFS | undefined) { this._fs = v; }
    protected _fs: IReadFS | undefined;

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
     * **优先走底层 FS 的批量能力**（`IReadFS.readStrings`，宿主 FS 实现了它）：一次往返读多个。
     * 理由是**调用方未必能并发**——编辑器加载资源那条链是引擎里的串行链，对那种调用方批量是唯一出路。
     * 底层没有这个能力（http 这类本地便宜的 FS）就退回**并发**逐个：
     * 实测并发比串行快 20× 以上，所以退路也不能是串行。
     *
     * 失败语义与"逐个读"保持一致：**任何一条失败就抛出**（原因取自那一条的批量结果）。
     * 批量结果里允许"一条失败不拖累其他条"，那是给"部分成功"的调用方用的；门面不改变原有契约。
     *
     * @param paths 路径
     */
    async readStrings(paths: string[])
    {
        const batch = this.fs.readStrings;

        if (!batch) return await Promise.all(paths.map((path) => this.readString(path)));

        const results = await batch.call(this.fs, paths);

        return results.map((result) =>
        {
            if (result.error !== undefined) throw new Error(result.error);
            // 既没有内容也没有原因 = 这个批量实现坏了；如实说出来，不要返回 undefined 让调用方后面才炸
            if (result.text === undefined) throw new Error(`批量读取 ${result.path} 既没有内容也没有失败原因`);

            return result.text;
        });
    }

    protected _images: { [path: string]: HTMLImageElement } = {};

    private _state: { [eventtype: string]: true } = {};
}

FS.fs = new ReadFS();

