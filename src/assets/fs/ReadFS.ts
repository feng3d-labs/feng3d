namespace feng3d
{
    /**
     * 默认文件系统
     */
    export var fs: ReadFS;
    /**
     * 可读文件系统
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
        abstract readArrayBuffer(path: string, callback: (err: Error, arraybuffer: ArrayBuffer) => void): void;

        /**
         * 读取文件为字符串
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        abstract readString(path: string, callback: (err: Error, str: string) => void): void;

        /**
         * 读取文件为Object
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        abstract readObject(path: string, callback: (err: Error, object: Object) => void): void;

        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        abstract readImage(path: string, callback: (err: Error, img: HTMLImageElement) => void): void;

        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         */
        abstract getAbsolutePath(path: string): string;

        /**
         * 读取文件列表为字符串列表
         * 
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readStrings(paths: string[], callback: (strs: (string | Error)[]) => void)
        {
            // var func = <TaskFunction<{ path: string, result: string | Error }>><any>callback;
            // func.data

            // var taskNodes: TaskNode<{ path: string}>[] = paths.map(v => { return { data: { path: v }, func: callback }; });

            Task.createTasks(paths, (path, callback) =>
            {
                this.readString(path, (err, str) =>
                {
                    callback(err || str);
                });
            }, callback).do();
        }
    }
}