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
    export var assetsmap = assetsmap || {};

    export interface IAssets
    {

        /**
         * 加载图片
         * @param url 图片路径
         * @param callback 加载完成回调
         */
        loadImage(url: string, callback: (img: HTMLImageElement) => void): void;
    }

    export class Assets implements IAssets
    {
        fstype = FSType.http;

        private getAssets(url: string)
        {
            if (url.indexOf("http://") != -1
                || url.indexOf("https://") != -1
            )
                return assetsmap[FSType.http];
            return assetsmap[this.fstype];
        }

        /**
         * 加载图片
         * @param url 图片路径
         * @param callback 加载完成回调
         */
        loadImage(url: string, callback: (img: HTMLImageElement) => void)
        {
            if (url == "" || url == null) 
            {
                callback(null);
                return;
            }
            this.getAssets(url).loadImage(url, (img) =>
            {
                if (!img)
                {
                    console.warn(`无法加载资源：${url}`);
                }
                callback(img);
            });
        }
    }

    assets = new Assets();
}