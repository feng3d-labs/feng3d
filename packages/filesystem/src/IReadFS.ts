import { FSType } from './FSType';

/**
 * **批量**读文本的逐条结果。
 *
 * 为什么不是 `string[]`：批量值得做，是因为"一次往返读多个"比"N 次往返读一个"便宜
 * （宿主 FS 每次调用两趟 HTTP，实测见 `scripts/editor-host-io-bench.mjs`）。
 * 而一次调用只要承载多个文件，就必然要回答**其中一个坏了怎么办**——
 * 逐条带结果（而不是整批 reject）才能既做到"一个坏文件不毁掉整批"，又保留"如实报错"。
 */
export interface ReadStringsResult
{
    /** 路径（与入参一一对应，顺序也不变） */
    readonly path: string;
    /** 内容（失败时没有这一项） */
    readonly text?: string;
    /** 失败原因（成功时没有这一项） */
    readonly error?: string;
}

/**
 * 可读文件系统
 */
export interface IReadFS
{
    /**
     * 文件系统类型
     */
    type: FSType;

    /**
     * 读取文件为ArrayBuffer
     * @param path 路径
     */
    readArrayBuffer(path: string): Promise<ArrayBuffer>;
    /**
     * 读取文件为字符串
     * @param path 路径
     */
    readString(path: string): Promise<string>;
    /**
     * 读取文件为Object
     * @param path 路径
     */
    readObject(path: string): Promise<unknown>;
    /**
     * 加载图片
     * @param path 图片路径
     * @param callback 加载完成回调
     *
     * 数据不存在时可能返回 `undefined`（如 IndexedDBFS），调用方需判空。
     */
    readImage(path: string): Promise<HTMLImageElement | undefined>;
    /**
     * 获取文件绝对路径
     * @param path （相对）路径
     */
    getAbsolutePath(path: string): string;
    /**
     * **批量**读文本（**可选能力**）。
     *
     * 只有"单次往返很贵"的文件系统才值得实现它——宿主 FS 每次调用两趟 HTTP；
     * 而本地 FS（indexedDB / 内存 / http）本来就没有这个成本，实现它没有收益。
     *
     * 所以它是**可选**的：调用方（`ReadFS.readStrings`）先看有没有，没有就退回"并发逐个"。
     * 这也正是"引擎不认识编辑器、却能吃上宿主批量"的那条缝：引擎只认这个接口，
     * `HostFS` 只是恰好实现了它。
     *
     * 契约（三条都要守）：
     * - **顺序与入参一致**且逐条对应（`results[i].path === paths[i]`）；
     * - **一条失败不拖累其他条**（该条给 `error`，其他条照旧给 `text`）；
     * - 入参为空数组时不发请求，直接回空数组。
     *
     * @param paths 路径列表
     * @returns 逐条结果（顺序与入参一致）
     */
    readStrings?(paths: string[]): Promise<ReadStringsResult[]>;
}
