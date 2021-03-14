namespace feng3d
{

    /**
     * 图片相关工具
     */
    export class ImageUtil
    {
        imageData: ImageData;

        /**
         * 获取图片数据
         * @param image 加载完成的图片元素
         */
        static fromImage(image: HTMLImageElement) 
        {
            return new ImageUtil().fromImage(image);
        }

        /**
         * 创建ImageData
         * @param width 数据宽度
         * @param height 数据高度
         * @param fillcolor 填充颜色
         */
        constructor(width = 1, height = 1, fillcolor = new Color4(0, 0, 0, 0))
        {
            this.init(width, height, fillcolor);
        }

        /**
         * 初始化
         * @param width 宽度
         * @param height 高度
         * @param fillcolor 填充颜色
         */
        init(width = 1, height = 1, fillcolor = new Color4(0, 0, 0, 0))
        {
            this.imageData = new ImageData(width, height);
            this.fillRect(new Rectangle(0, 0, width, height), fillcolor);
        }

        /**
         * 获取图片数据
         * @param image 加载完成的图片元素
         */
        fromImage(image: HTMLImageElement) 
        {
            if (!image) return null;
            var canvasImg = document.createElement("canvas");
            canvasImg.width = image.width;
            canvasImg.height = image.height;

            var ctxt = canvasImg.getContext('2d');
            console.assert(!!ctxt);
            ctxt.drawImage(image, 0, 0);
            this.imageData = ctxt.getImageData(0, 0, image.width, image.height);//读取整张图片的像素。
            return this;
        }

        /**
         * 绘制图片数据指定位置颜色
         * @param x 图片数据x坐标
         * @param y 图片数据y坐标
         * @param color 颜色值
         */
        drawPixel(x: number, y: number, color: Color4)
        {
            var oldColor = this.getPixel(x, y);
            oldColor.mix(color, color.a);
            this.setPixel(x, y, oldColor);
            return this;
        }

        /**
         * 获取图片指定位置颜色值
         * @param x 图片数据x坐标
         * @param y 图片数据y坐标
         */
        getPixel(x: number, y: number)
        {
            var pos = (x + y * this.imageData.width) * 4;
            var color = new Color4(this.imageData.data[pos] / 255, this.imageData.data[pos + 1] / 255, this.imageData.data[pos + 2] / 255, this.imageData.data[pos + 3] / 255);
            return color;
        }

        /**
         * 设置指定位置颜色值
         * @param imageData 图片数据 
         * @param x 图片数据x坐标
         * @param y 图片数据y坐标
         * @param color 颜色值
         */
        setPixel(x: number, y: number, color: Color4)
        {
            x = Math.round(x)
            y = Math.round(y)
            var pos = (x + y * this.imageData.width) * 4;

            this.imageData.data[pos] = color.r * 255;
            this.imageData.data[pos + 1] = color.g * 255;
            this.imageData.data[pos + 2] = color.b * 255;
            this.imageData.data[pos + 3] = color.a * 255;
            return this;
        }

        /**
         * 清理图片数据
         * @param clearColor 清理时填充颜色
         */
        clear(clearColor = new Color4(0, 0, 0, 0))
        {
            for (let i = 0; i < this.imageData.width; i++)
            {
                for (let j = 0; j < this.imageData.height; j++)
                {
                    this.setPixel(i, j, clearColor);
                }
            }
        }

        /**
         * 填充矩形
         * @param rect 填充的矩形
         * @param fillcolor 填充颜色
         */
        fillRect(rect: Rectangle, fillcolor = new Color4())
        {
            for (let i = rect.x > 0 ? rect.x : 0; i < this.imageData.width && i < rect.x + rect.width; i++)
            {
                for (let j = rect.y > 0 ? rect.y : 0; j < this.imageData.height && j < rect.y + rect.height; j++)
                {
                    this.setPixel(i, j, fillcolor);
                }
            }
        }

        /**
         * 绘制线条
         * @param start 起始坐标
         * @param end 终止坐标
         * @param color 线条颜色
         */
        drawLine(start: Vector2, end: Vector2, color: Color4)
        {
            var length = end.subTo(start).length;
            var p = new Vector2();
            for (let i = 0; i <= length; i++)
            {
                start.lerpNumberTo(end, i / length, p);
                this.setPixel(p.x, p.y, color);
            }
            return this;
        }

        /**
         * 绘制点
         * @param x x坐标
         * @param y y坐标
         * @param color 颜色
         * @param size 尺寸
         */
        drawPoint(x: number, y: number, color: Color4, size = 1)
        {
            var half = Math.floor(size / 2);
            //
            var sx = x - half; if (sx < 0) sx = 0;
            var ex = x - half + size; if (ex > this.imageData.width) ex = this.imageData.width;
            var sy = y - half; if (sy < 0) sy = 0;
            var ey = y - half + size; if (ey > this.imageData.height) ey = this.imageData.height;
            //
            for (let i = sx; i < ex; i++)
            {
                for (let j = sy; j < ey; j++)
                {
                    this.setPixel(i, j, color);
                }
            }
            return this;
        }

        /**
         * 绘制图片数据
         * @param imageData 图片数据
         * @param x x坐标
         * @param y y坐标
         */
        drawImageData(imageData: ImageData, x: number, y: number)
        {
            var rect = new Rectangle(0, 0, this.imageData.width, this.imageData.height).intersection(new Rectangle(x, y, imageData.width, imageData.height));

            var imageUtil = new ImageUtil(); imageUtil.imageData = imageData;
            for (let i = rect.x; i < rect.x + rect.width; i++)
            {
                for (let j = rect.y; j < rect.y + rect.height; j++)
                {
                    var c = imageUtil.getPixel(i - x, j - y);
                    this.drawPixel(i, j, c);
                }
            }

            return this;
        }

        /**
         * 转换为DataUrl字符串数据
         */
        toDataURL()
        {
            return dataTransform.imageDataToDataURL(this.imageData);
        }

        /**
         * 创建默认粒子贴图
         * @param size 尺寸
         */
        drawDefaultParticle(size = 64)
        {
            var imageData = new ImageData(size, size);

            var half = size / 2;
            for (let i = 0; i < size; i++)
            {
                for (let j = 0; j < size; j++)
                {
                    var l = Math.clamp(new Vector2(i - half, j - half).length, 0, half) / half;
                    var f = 1 - l;
                    f = f * f;

                    var pos = (i + j * size) * 4;
                    imageData.data[pos] = f * 255;
                    imageData.data[pos + 1] = f * 255;
                    imageData.data[pos + 2] = f * 255;
                    imageData.data[pos + 3] = f * 255;
                }
            }
            this.imageData = imageData;
            return this;
        }

        /**
         * 创建颜色拾取矩形
         * @param color 基色
         * @param width 宽度    
         * @param height 高度
         */
        drawColorPickerRect(color: number)
        {
            Image
            var leftTop = new Color3(1, 1, 1);
            var rightTop = new Color3().fromUnit(color);
            var leftBottom = new Color3(0, 0, 0);
            var rightBottom = new Color3(0, 0, 0);

            //
            for (let i = 0; i < this.imageData.width; i++)
            {
                for (let j = 0; j < this.imageData.height; j++)
                {
                    var top = leftTop.mixTo(rightTop, i / this.imageData.width);
                    var bottom = leftBottom.mixTo(rightBottom, i / this.imageData.width);
                    var v = top.mixTo(bottom, j / this.imageData.height);

                    this.setPixel(i, j, v.toColor4())
                }
            }
            return this;
        }

        drawColorRect(color: Color4)
        {
            var colorHeight = Math.floor(this.imageData.height * 0.8);
            var alphaWidth = Math.floor(color.a * this.imageData.width);

            var color4 = color.clone(); color4.a = 1;
            var white = new Color4(1, 1, 1);
            var black = new Color4(0, 0, 0);
            //
            for (let i = 0; i < this.imageData.width; i++)
            {
                for (let j = 0; j < this.imageData.height; j++)
                {
                    //
                    if (j <= colorHeight)
                    {
                        this.setPixel(i, j, color4)
                    } else
                    {
                        this.setPixel(i, j, i < alphaWidth ? white : black)
                    }
                }
            }
            return this;
        }

        /**
         * 
         * @param gradient 
         * @param dirw true为横向条带，否则纵向条带
         */
        drawMinMaxGradient(gradient: Gradient, dirw = true)
        {
            //
            for (let i = 0; i < this.imageData.width; i++)
            {
                for (let j = 0; j < this.imageData.height; j++)
                {
                    var c = gradient.getValue(dirw ? i / (this.imageData.width - 1) : j / (this.imageData.height - 1));

                    this.setPixel(i, j, c);
                }
            }
            return this;
        }

        /**
         * 绘制曲线
         * @param curve 曲线
         * @param between0And1 是否显示值在[0,1]区间，否则[-1,1]区间
         * @param color 曲线颜色
         */
        drawCurve(curve: AnimationCurve, between0And1: boolean, color: Color4, rect = null)
        {
            rect = rect || new Rectangle(0, 0, this.imageData.width, this.imageData.height);
            var range = between0And1 ? [1, 0] : [1, -1];

            var prepos = new Vector2();
            var curpos = new Vector2();
            //
            for (let i = 0; i < rect.width; i++)
            {
                //
                var y = curve.getValue(i / (rect.width - 1));

                y = Math.mapLinear(y, range[0], range[1], 0, 1);

                var j = Math.round(y * (rect.height - 1));

                //
                curpos.x = rect.x + i;
                curpos.y = rect.y + j;
                if (i > 0)
                {
                    this.drawLine(prepos, curpos, color);
                }
                prepos.x = curpos.x;
                prepos.y = curpos.y;
            }
            return this;
        }

        /**
         * 绘制双曲线
         * @param curve 曲线
         * @param curve1 曲线
         * @param between0And1  是否显示值在[0,1]区间，否则[-1,1]区间
         * @param curveColor 颜色
         */
        drawBetweenTwoCurves(curve: AnimationCurve, curve1: AnimationCurve, between0And1: boolean, curveColor = new Color4(), fillcolor = new Color4(1, 1, 1, 0.5), rect = null)
        {
            rect = rect || new Rectangle(0, 0, this.imageData.width, this.imageData.height);
            var range = between0And1 ? [1, 0] : [1, -1];

            var prepos0 = new Vector2();
            var curpos0 = new Vector2();
            var prepos1 = new Vector2();
            var curpos1 = new Vector2();
            //
            for (let i = 0; i < rect.width; i++)
            {
                //
                var y0 = curve.getValue(i / (rect.width - 1));
                var y1 = curve1.getValue(i / (rect.width - 1));

                y0 = Math.mapLinear(y0, range[0], range[1], 0, 1);
                y1 = Math.mapLinear(y1, range[0], range[1], 0, 1);

                y0 = Math.round(y0 * (rect.height - 1));
                y1 = Math.round(y1 * (rect.height - 1));

                curpos0.x = rect.x + i;
                curpos0.y = rect.y + y0;
                curpos1.x = rect.x + i;
                curpos1.y = rect.y + y1;

                this.drawLine(new Vector2(rect.x + i, rect.y + y0), new Vector2(rect.x + i, rect.y + y1), fillcolor);
                if (i > 0)
                {
                    this.drawLine(prepos0, curpos0, curveColor);
                    this.drawLine(prepos1, curpos1, curveColor);
                }
                prepos0.x = curpos0.x;
                prepos0.y = curpos0.y;
                prepos1.x = curpos1.x;
                prepos1.y = curpos1.y;

            }
            return this;
        }

        /**
         * 清理背景颜色，目前仅用于特定的抠图，例如 editor\resource\assets\3d\terrain\terrain_brushes.png
         * @param backColor 背景颜色
         */
        clearBackColor(backColor: Color4)
        {
            for (let i = 0; i < this.imageData.width; i++)
            {
                for (let j = 0; j < this.imageData.height; j++)
                {
                    var t = this.getPixel(i, j);
                    var a = 1 - t.r / backColor.r;
                    t.r = t.g = t.b = 0;
                    t.a = a;
                    this.setPixel(i, j, t);
                }
            }


        }
    }
}