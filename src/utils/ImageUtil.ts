namespace feng3d
{
    export var ImageUtil = {

        /**
         * 加载图片
         * @param url 图片路径
         * @param callback 加载完成回调
         */
        loadImage(url: string, callback: (image: HTMLImageElement) => void) 
        {
            assets.loadImage(url, callback);
        },
        /**
         * 获取图片数据
         * @param image 加载完成的图片元素
         */
        getImageData(image: HTMLImageElement) 
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
        getImageDataFromUrl(url: string, callback: (imageData: ImageData) => void) 
        {
            ImageUtil.loadImage(url, (image) =>
            {
                var imageData = ImageUtil.getImageData(image);
                callback(imageData);
            });
        },
        /**
         * 创建ImageData
         * @param width 数据宽度
         * @param height 数据高度
         * @param fillcolor 填充颜色
         */
        createImageData(width = 1024, height = 1024, fillcolor = 0)
        {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            var ctx = canvas.getContext('2d');
            ctx.fillStyle = new Color().fromUnit(fillcolor).toHexString();
            ctx.fillRect(0, 0, width, height);

            var imageData = ctx.getImageData(0, 0, width, height);

            return imageData;
        },
    };
}