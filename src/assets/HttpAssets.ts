namespace feng3d
{
    export var httpAssets: HttpAssets;

    export class HttpAssets implements IAssets
    {
        /**
         * 加载图片
         * @param url 图片路径
         * @param callback 加载完成回调
         */
        loadImage(url: string, callback: (img: HTMLImageElement) => void): void
        {
            var image = new Image();
            image.crossOrigin = "Anonymous";
            image.onload = () =>
            {
                callback && callback(image);
                image.onload = null;
            }
            image.src = url;
        }
    }

    assetsmap[FSType.http] = httpAssets = new HttpAssets();
}