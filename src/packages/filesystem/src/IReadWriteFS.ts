import { IReadFS } from './IReadFS';

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
    writeObject(path: string, object: any): Promise<void>;
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
