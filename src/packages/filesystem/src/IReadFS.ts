import { FSType } from './FSType';

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
    readObject(path: string): Promise<any>;
    /**
     * 加载图片
     * @param path 图片路径
     * @param callback 加载完成回调
     */
    readImage(path: string): Promise<HTMLImageElement>;
    /**
     * 获取文件绝对路径
     * @param path （相对）路径
     */
    getAbsolutePath(path: string): string;
}
