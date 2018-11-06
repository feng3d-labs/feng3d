namespace feng3d
{
    /**
     * 图片相关工具
     */
    export var imageUtil: ImageUtil;

    /**
     * 图片相关工具
     */
    export class ImageUtil
    {
        /**
         * 加载图片
         * @param url 图片路径
         * @param callback 加载完成回调
         */
        loadImage(url: string, callback: (err: Error, image: HTMLImageElement) => void) 
        {
            assets.readImage(url, callback);
        }

        /**
         * 获取图片数据
         * @param image 加载完成的图片元素
         */
        getImageData(image: HTMLImageElement) 
        {
            if (!image) return null;
            var canvasImg = document.createElement("canvas");
            canvasImg.width = image.width;
            canvasImg.height = image.height;

            var ctxt = canvasImg.getContext('2d');
            assert(!!ctxt);
            ctxt.drawImage(image, 0, 0);
            var imageData = ctxt.getImageData(0, 0, image.width, image.height);//读取整张图片的像素。
            return imageData;
        }

        /**
         * 从url获取图片数据
         * @param url 图片路径
         * @param callback 获取图片数据完成回调
         */
        getImageDataFromUrl(url: string, callback: (imageData: ImageData) => void) 
        {
            this.loadImage(url, (err, image) =>
            {
                var imageData = this.getImageData(image);
                callback(imageData);
            });
        }

        /**
         * 创建ImageData
         * @param width 数据宽度
         * @param height 数据高度
         * @param fillcolor 填充颜色
         */
        createImageData(width = 1024, height = 1024, fillcolor = new Color4())
        {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            var ctx = canvas.getContext('2d');
            ctx.fillStyle = Color3.fromColor4(fillcolor).toHexString();
            var backAlpha = ctx.globalAlpha;
            ctx.globalAlpha = fillcolor.a;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = backAlpha;

            var imageData = ctx.getImageData(0, 0, width, height);

            return imageData;
        }

        /**
         * 创建默认粒子贴图
         * @param size 尺寸
         */
        createDefaultParticle(size = 64)
        {
            var canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;

            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, size, size);

            var half = size / 2;
            for (let i = 0; i < size; i++)
            {
                for (let j = 0; j < size; j++)
                {
                    var l = FMath.clamp(new Vector2(i - half, j - half).length, 0, half) / half;
                    // l = l * l;
                    var f = 1 - l;
                    f = f * f;
                    // f = f * f * f;
                    // f = - 8 / 3 * f * f * f + 4 * f * f - f / 3;

                    var pos = (i + j * size) * 4;
                    imageData.data[pos] = 255;
                    imageData.data[pos + 1] = 255;
                    imageData.data[pos + 2] = 255;
                    imageData.data[pos + 3] = f * 255;
                }
            }
            return imageData;
        }

        /**
         * 创建颜色拾取矩形
         * @param color 基色
         * @param width 宽度    
         * @param height 高度
         */
        createColorPickerRect(color: number, width = 64, height = 64)
        {
            var leftTop = new Color3(1, 1, 1);
            var rightTop = new Color3().fromUnit(color);
            var leftBottom = new Color3(0, 0, 0);
            var rightBottom = new Color3(0, 0, 0);

            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, width, height);
            var data = imageData.data;
            //
            for (let i = 0; i < width; i++)
            {
                for (let j = 0; j < height; j++)
                {
                    var top = leftTop.mixTo(rightTop, i / width);
                    var bottom = leftBottom.mixTo(rightBottom, i / width);
                    var v = top.mixTo(bottom, j / height);
                    //
                    var pos = (i + j * width) * 4;
                    data[pos] = v.r * 255;
                    data[pos + 1] = v.g * 255;
                    data[pos + 2] = v.b * 255;
                    data[pos + 3] = 255;
                }
            }
            return imageData;
        }

        /**
         * 获取颜色的基色以及颜色拾取矩形所在位置
         * @param color 查找颜色
         */
        getColorPickerRectAtPosition(color: number, rw: number, rh: number)
        {
            var leftTop = new Color3(1, 1, 1);
            var rightTop = new Color3().fromUnit(color);
            var leftBottom = new Color3(0, 0, 0);
            var rightBottom = new Color3(0, 0, 0);

            var top = leftTop.mixTo(rightTop, rw);
            var bottom = leftBottom.mixTo(rightBottom, rw);
            var v = top.mixTo(bottom, rh);
            return v;
        }

        /**
         * 获取颜色的基色以及颜色拾取矩形所在位置
         * @param color 查找颜色
         */
        getColorPickerRectPosition(color: number)
        {
            var black = new Color3(0, 0, 0);
            var white = new Color3(1, 1, 1);

            var c = new Color3().fromUnit(color);
            var max = Math.max(c.r, c.g, c.b);
            if (max != 0)
                c = black.mix(c, 1 / max);
            var min = Math.min(c.r, c.g, c.b);
            if (min != 1)
                c = white.mix(c, 1 / (1 - min));
            var ratioH = 1 - max;
            var ratioW = 1 - min;
            return {
                /**
                 * 基色
                 */
                color: c,
                /**
                 * 横向位置
                 */
                ratioW: ratioW,
                /**
                 * 纵向位置
                 */
                ratioH: ratioH
            }
        }

        /**
         * 创建颜色条带
         * @param colors 
         * @param ratios [0,1]
         * @param width 
         * @param height 
         * @param dirw true为横向条带，否则纵向条带
         */
        createColorPickerStripe(width: number, height: number, colors: number[], ratios?: number[], dirw = true)
        {
            if (!ratios)
            {
                ratios = [];
                for (let i = 0; i < colors.length; i++)
                {
                    ratios[i] = i / (colors.length - 1);
                }
            }

            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, width, height);

            //
            for (let i = 0; i < width; i++)
            {
                for (let j = 0; j < height; j++)
                {
                    var v = this.getMixColor(colors, ratios, dirw ? i / (width - 1) : j / (height - 1));
                    //
                    var pos = (i + j * width) * 4;
                    imageData.data[pos] = v.r * 255;
                    imageData.data[pos + 1] = v.g * 255;
                    imageData.data[pos + 2] = v.b * 255;
                    imageData.data[pos + 3] = 255;
                }
            }
            return imageData;
        }

        getMixColor(colors: number[], ratios: number[], ratio: number)
        {
            if (!ratios)
            {
                ratios = [];
                for (let i = 0; i < colors.length; i++)
                {
                    ratios[i] = i / (colors.length - 1);
                }
            }

            var colors1 = colors.map(v => new Color3().fromUnit(v));

            for (var i = 0; i < colors1.length - 1; i++)
            {
                if (ratios[i] <= ratio && ratio <= ratios[i + 1])
                {
                    var v = FMath.mapLinear(ratio, ratios[i], ratios[i + 1], 0, 1)
                    var c = colors1[i].mixTo(colors1[i + 1], v);
                    return c;
                }
            }
            return colors1[0];
        }

        getMixColorRatio(color: number, colors: number[], ratios?: number[])
        {
            if (!ratios)
            {
                ratios = [];
                for (let i = 0; i < colors.length; i++)
                {
                    ratios[i] = i / (colors.length - 1);
                }
            }

            var colors1 = colors.map(v => new Color3().fromUnit(v));
            var c = new Color3().fromUnit(color);

            var r = c.r;
            var g = c.g;
            var b = c.b;

            for (var i = 0; i < colors1.length - 1; i++)
            {
                var c0 = colors1[i];
                var c1 = colors1[i + 1];
                //
                if (c.equals(c0)) return ratios[i];
                if (c.equals(c1)) return ratios[i + 1];
                //
                var r1 = c0.r + c1.r;
                var g1 = c0.g + c1.g;
                var b1 = c0.b + c1.b;
                //
                var v = r * r1 + g * g1 + b * b1;
                if (v > 2)
                {
                    var result = 0;
                    if (r1 == 1)
                    {
                        result = FMath.mapLinear(r, c0.r, c1.r, ratios[i], ratios[i + 1]);
                    } else if (g1 == 1)
                    {
                        result = FMath.mapLinear(g, c0.g, c1.g, ratios[i], ratios[i + 1]);
                    } else if (b1 == 1)
                    {
                        result = FMath.mapLinear(b, c0.b, c1.b, ratios[i], ratios[i + 1]);
                    }
                    return result;
                }
            }
            return 0;
        }

        getMixColorAtRatio(ratio: number, colors: number[], ratios?: number[])
        {
            if (!ratios)
            {
                ratios = [];
                for (let i = 0; i < colors.length; i++)
                {
                    ratios[i] = i / (colors.length - 1);
                }
            }

            var colors1 = colors.map(v => new Color3().fromUnit(v));

            for (var i = 0; i < colors1.length - 1; i++)
            {
                if (ratios[i] <= ratio && ratio <= ratios[i + 1])
                {
                    var mix = FMath.mapLinear(ratio, ratios[i], ratios[i + 1], 0, 1);
                    var c = colors1[i].mixTo(colors1[i + 1], mix);
                    return c;
                }
            }
            return colors1[0];
        }

        createColorRect(color: Color4, width: number, height: number)
        {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, width, height);

            var colorHeight = Math.floor(height * 0.8);
            var alphaWidth = Math.floor(color.a * width);

            //
            for (let i = 0; i < width; i++)
            {
                for (let j = 0; j < height; j++)
                {
                    //
                    var pos = (i + j * width) * 4;
                    if (j <= colorHeight)
                    {
                        imageData.data[pos] = color.r * 255;
                        imageData.data[pos + 1] = color.g * 255;
                        imageData.data[pos + 2] = color.b * 255;
                        imageData.data[pos + 3] = 255;
                    } else
                    {
                        var v = i < alphaWidth ? 255 : 0;
                        imageData.data[pos] = v;
                        imageData.data[pos + 1] = v;
                        imageData.data[pos + 2] = v;
                        imageData.data[pos + 3] = 255;
                    }
                }
            }

            return imageData;
        }

        createMinMaxGradientRect(gradient: IMinMaxGradient, width: number, height: number)
        {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, width, height);

            //
            for (let i = 0; i < width; i++)
            {
                for (let j = 0; j < height; j++)
                {
                    //
                    var pos = (i + j * width) * 4;

                    var c = gradient.getValue(i / (width - 1));

                    imageData.data[pos] = c.r * 255;
                    imageData.data[pos + 1] = c.g * 255;
                    imageData.data[pos + 2] = c.b * 255;
                    imageData.data[pos + 3] = c.a * 255;
                }
            }

            return imageData;
        }

        /**
         * 绘制曲线矩形块
         * @param curve 
         * @param width 
         * @param height 
         * @param color 
         * @param backColor 
         */
        createAnimationCurveRect(curve: AnimationCurve, between0And1: boolean, width: number, height: number, color = new Color4(1, 0, 0), backColor = new Color4())
        {
            var imageData = this.createImageData(width, height, backColor);

            this.drawImageDataCurve(imageData, curve, between0And1, color);

            return imageData;
        }

        /**
         * 绘制曲线
         * @param imageData 
         * @param curve 
         * @param between0And1 
         * @param color4 
         */
        private drawImageDataCurve(imageData: ImageData, curve: AnimationCurve, between0And1: boolean, color4: Color4)
        {
            //
            for (let i = 0; i < imageData.width; i++)
            {
                //
                var y = curve.getValue(i / (imageData.width - 1));
                if (!between0And1) y = (y + 1) / 2;
                var j = Math.round((1 - y) * (imageData.height - 1));
                this.setImageDataPixel(imageData, i, j, color4);
            }
        }

        /**
         * 绘制双曲线
         * @param minMaxCurveRandomBetweenTwoCurves 
         * @param width 
         * @param height 
         * @param color 
         * @param backColor 
         */
        createMinMaxCurveRandomBetweenTwoCurvesRect(minMaxCurveRandomBetweenTwoCurves: MinMaxCurveRandomBetweenTwoCurves, between0And1: boolean, width: number, height: number, color = new Color4(1, 0, 0), backColor = new Color4())
        {
            var imageData = this.createImageData(width, height, backColor);

            this.drawImageDataBetweenTwoCurves(imageData, minMaxCurveRandomBetweenTwoCurves, between0And1, color);

            return imageData;
        }

        /**
         * 绘制双曲线
         * @param imageData 
         * @param minMaxCurveRandomBetweenTwoCurves 
         * @param between0And1 
         * @param color4 
         */
        drawImageDataBetweenTwoCurves(imageData: ImageData, minMaxCurveRandomBetweenTwoCurves: MinMaxCurveRandomBetweenTwoCurves, between0And1: boolean, color4: Color4): any
        {
            //
            for (let i = 0; i < imageData.width; i++)
            {
                //
                var y0 = minMaxCurveRandomBetweenTwoCurves.curveMin.getValue(i / (imageData.width - 1));
                var y1 = minMaxCurveRandomBetweenTwoCurves.curveMax.getValue(i / (imageData.width - 1));

                if (!between0And1) y0 = (y0 + 1) / 2;
                if (!between0And1) y1 = (y1 + 1) / 2;

                y0 = Math.round((1 - y0) * (imageData.height - 1));
                y1 = Math.round((1 - y1) * (imageData.height - 1));

                for (let j = 0; j < imageData.height; j++)
                {
                    var pos = (i + j * imageData.width) * 4;
                    var v = (y0 - j) * (y1 - j);
                    if (v <= 0)
                    {
                        color4.a = v == 0 ? 1 : 0.5;
                        this.setImageDataPixel(imageData, i, j, color4);
                    }
                }
            }
        }

        drawImageDataPixel(imageData: ImageData, x: number, y: number, color: Color4)
        {
            var oldColor = this.getImageDataPixel(imageData, x, y);
            oldColor.mix(color);
            this.setImageDataPixel(imageData, x, y, oldColor);
        }

        getImageDataPixel(imageData: ImageData, x: number, y: number)
        {
            var pos = (x + y * imageData.width) * 4;
            var color = new Color4(imageData.data[pos] / 255, imageData.data[pos + 1] / 255, imageData.data[pos + 2] / 255, imageData.data[pos + 3] / 255);
            return color;
        }

        setImageDataPixel(imageData: ImageData, x: number, y: number, color: Color4)
        {
            var pos = (x + y * imageData.width) * 4;

            imageData.data[pos] = color.r * 255;
            imageData.data[pos + 1] = color.g * 255;
            imageData.data[pos + 2] = color.b * 255;
            imageData.data[pos + 3] = color.a * 255;
        }
    }

    imageUtil = new ImageUtil();
}