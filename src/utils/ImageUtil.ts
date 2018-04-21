namespace feng3d
{
    export var ImageUtil = {

        /**
         * 加载图片
         * @param url 图片路径
         * @param callback 加载完成回调
         */
        loadImage: (url: string, callback: (image: HTMLImageElement) => void) =>
        {
            var image = new Image();
            image.crossOrigin = "Anonymous";
            image.addEventListener("load", onHeightMapLoad);
            image.src = url;

            function onHeightMapLoad()
            {
                image.removeEventListener("load", onHeightMapLoad);
                callback && callback(image);
            }
        },
        /**
         * 获取图片数据
         * @param image 加载完成的图片元素
         */
        getImageData: (image: HTMLImageElement) =>
        {
            var canvasImg = document.createElement("canvas");
            canvasImg.width = image.width;
            canvasImg.height = image.height;

            var ctxt = canvasImg.getContext('2d');
            assert(!!ctxt);
            ctxt.drawImage(image, 0, 0);
            var imageData = ctxt.getImageData(0, 0, image.width, image.height);//读取整张图片的像素。
            return imageData;
        },
        /**
         * 从url获取图片数据
         * @param url 图片路径
         * @param callback 获取图片数据完成回调
         */
        getImageDataFromUrl: (url: string, callback: (imageData: ImageData) => void) =>
        {
            ImageUtil.loadImage(url, (image) =>
            {
                var imageData = ImageUtil.getImageData(image);
                callback(imageData);
            });
        },
    };
}