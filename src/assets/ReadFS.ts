namespace feng3d
{
    /**
     * 可读文件系统
     * 
     * 针对基础文件系统进行扩展
     */
    export abstract class ReadFS
    {
        /**
         * 文件系统类型
         */
        readonly type: FSType;

        /**
         * 读取文件为ArrayBuffer
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        abstract readArrayBuffer(path: string, callback: (err: Error, data: ArrayBuffer) => void): void;

        /**
         * 读取文件为字符串
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        abstract readString(path: string, callback: (err: Error, data: string) => void): void;

        /**
         * 读取文件为Object
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        abstract readObject(path: string, callback: (err: Error, data: Object) => void): void;

        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        abstract readImage(path: string, callback: (err: Error, img: HTMLImageElement) => void): void;

        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        abstract getAbsolutePath(path: string, callback: (err: Error, absolutePath: string) => void): void;
    }
}