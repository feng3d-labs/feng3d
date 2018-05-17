namespace feng3d
{
    /**
     * 文件系统类型
     */
    export enum FSType
    {
        http = "http",
        native = "native",
        indexedDB = "indexedDB"
    }

    /**
     * 资源系统
     */
    export var assets: Assets;

    /**
     * 资源
     * 在可读文件系统上进行加工，比如把读取数据转换为图片或者文本
     */
    export class Assets implements ReadFS
    {
        /**
         * 可读文件系统
         */
        readFS: ReadFS = httpAssets;

        get type()
        {
            return this.readFS.type;
        }

        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFile(path: string, callback: (err, data: ArrayBuffer) => void)
        {
            this.readFS.readFile(path, callback);
        }

        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        loadImage(path: string, callback: (err: Error, img: HTMLImageElement) => void)
        {
            if (path == "" || path == null) 
            {
                callback(new Error("无效路径!"), null);
                return;
            }
            this.readFile(path, (err, data) =>
            {
                if (err)
                {
                    callback(err, null);
                    return;
                }
                dataTransform.arrayBufferToImage(data, (img) =>
                {
                    callback(null, img);
                });
            });
        }
    }

    assets = new Assets();

    /**
     * 可读文件系统
     */
    export interface ReadFS
    {
        /**
         * 文件系统类型
         */
        readonly type: FSType;
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFile(path: string, callback: (err, data: ArrayBuffer) => void);
    }
}