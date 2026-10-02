import { IReadFS } from './IReadFS';

/**
 * 目录条目（**带类型**）。
 *
 * `readdir` 只回名字，于是"这名字是文件还是目录"要靠**再一次** `isDirectory` 问出来——
 * 在宿主 FS 上那就是每个条目多两趟 HTTP。而宿主列目录本来就把类型一起给了
 * （`host.workspace.list` 返回 `{ name, path, directory }`），信息在半路被丢掉、又补问一遍。
 *
 * 这个类型就是给那条信息留的位置。
 */
export interface ReaddirEntry
{
    /** 条目名（不含父路径） */
    readonly name: string;
    /** 是不是目录 */
    readonly directory: boolean;
}

/**
 * 可读写文件系统
 *
 * 扩展基础可读写文件系统
 */
export interface IReadWriteFS extends IReadFS
{
    /**
     * 项目名称（表单名称）
     */
    projectname: string;
    /**
     * 文件是否存在
     * @param path 文件路径
     */
    exists(path: string): Promise<boolean>;
    /**
     * 读取文件夹中文件列表
     * @param path 路径
     */
    readdir(path: string): Promise<string[]>;
    /**
     * 读取文件夹中文件列表（**带类型**，可选能力）。
     *
     * 与 `readStrings` 同理：只有"问一次很贵"的文件系统才值得实现。
     * 实现了它，调用方（`ReadWriteFS.getAllPathsInFolder`）就不必对每个条目再问一次
     * `isDirectory`；没实现就退回"并发逐个问"。
     *
     * 契约：条目顺序与 `readdir` 一致（调用方会依赖它决定遍历顺序）。
     *
     * @param path 路径
     * @returns 条目（带类型）
     */
    readdirWithTypes?(path: string): Promise<ReaddirEntry[]>;
    /**
     * 新建文件夹
     * @param path 文件夹路径
     */
    mkdir(path: string): Promise<void>;
    /**
     * 删除文件
     * @param path 文件路径
     */
    deleteFile(path: string): Promise<void>;
    /**
     * 写ArrayBuffer(新建)文件
     * @param path 文件路径
     * @param arraybuffer 文件数据
     */
    writeArrayBuffer(path: string, arraybuffer: ArrayBuffer): Promise<void>;
    /**
     * 写字符串到(新建)文件
     * @param path 文件路径
     * @param str 文件数据
     */
    writeString(path: string, str: string): Promise<void>;
    /**
     * 写Object到(新建)文件
     * @param path 文件路径
     * @param object 文件数据
     */
    writeObject(path: string, object: unknown): Promise<void>;
    /**
     * 写图片
     * @param path 图片路径
     * @param image 图片
     */
    writeImage(path: string, image: HTMLImageElement): Promise<void>;
    /**
     * 复制文件
     * @param src 源路径
     * @param dest 目标路径
     */
    copyFile(src: string, dest: string): Promise<void>;
    /**
     * 是否为文件夹
     *
     * @param path 文件路径
     */
    isDirectory(path: string): Promise<boolean>;
    /**
     * 初始化项目
     * @param projectname 项目名称
     */
    initproject(projectname: string): Promise<string>;
    /**
     * 是否存在指定项目
     * @param projectname 项目名称
     */
    hasProject(projectname: string): Promise<boolean>;
}
