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

    export var assets: Assets;
    export var assetsmap: { [fstype: string]: ReadFS } = {};

    export interface IAssets
    {
        /**
         * 加载图片
         * @param url 图片路径
         * @param callback 加载完成回调
         */
        loadImage(url: string, callback: (err: Error, img: HTMLImageElement) => void): void;
    }

    export class Assets implements IAssets
    {
        fstype = FSType.http;

        private getAssets(path: string)
        {
            if (path.indexOf("http://") != -1
                || path.indexOf("https://") != -1
            )
                return assetsmap[FSType.http];
            return assetsmap[this.fstype];
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
            var readFS = this.getAssets(path);
            readFS.readFile(path, (err, data) =>
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
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFile(path: string, callback: (err, data: ArrayBuffer) => void);
    }
}