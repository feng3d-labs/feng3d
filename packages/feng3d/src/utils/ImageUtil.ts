import { AnimationCurve, Gradient, RectangleLike, rect2Intersection, Vector2, Vector2Like, vec2Length, vec2LerpNumber, vec2Sub } from '@feng3d/math';
import { dataTransform, mathUtil } from '@feng3d/polyfill';

/**
 * `ImageUtil` 的颜色参数形状（issue #134）。
 *
 * 只需要可读的 r/g/b(/a)——这样既接受 feng3d 的**纯数据颜色 interface**
 * （`{ __type__: 'Color3' | 'Color4', r?, g?, b?, a? }`，字段可选），
 * 也接受 `@feng3d/math` 的颜色数据（阶段 C-b 起同样是带 `__type__` 的纯数据，只是字段必填），
 * 于是 `ImageUtil` 不再依赖颜色 class 的实例方法（`mix` / `clone` / `fromUnit` …），
 * 编辑器侧也就不再需要 `toImageUtilColor()` 这种边界转换。
 */
export interface ImageUtilColorLike
{
    readonly r?: number;
    readonly g?: number;
    readonly b?: number;
    readonly a?: number;
}

/** 归一化的颜色（各分量都是数字） */
export interface NormalizedColor
{
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * 归一化颜色：分量缺失时按渲染端约定补 1（rgb 补白、alpha 补不透明）。
 *
 * 与 `packages/webgpu/src/caches/color4Logic.ts` 的 `c.r ?? 1` 保持一致。
 */
export function normalizeColor(color: ImageUtilColorLike, defaultA = 1): NormalizedColor
{
    return {
        r: color.r ?? 1,
        g: color.g ?? 1,
        b: color.b ?? 1,
        a: color.a ?? defaultA,
    };
}

/** rgb 插值 `a*(1-rate) + b*rate`（替代旧 class 的 `mix()` / `mixTo()`，返回新对象） */
function mixRgb(a: { r: number, g: number, b: number }, b: { r: number, g: number, b: number }, rate: number)
{
    return {
        r: a.r * (1 - rate) + b.r * rate,
        g: a.g * (1 - rate) + b.g * rate,
        b: a.b * (1 - rate) + b.b * rate,
    };
}

/** 24 位颜色整数 → rgb（替代旧 class 的 `Color3.fromUnit()`） */
function rgbFromUnit(color: number)
{
    return {
        r: ((color >> 16) & 0xff) / 0xff,
        g: ((color >> 8) & 0xff) / 0xff,
        b: (color & 0xff) / 0xff,
    };
}

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
    constructor(width = 1, height = 1, fillcolor: ImageUtilColorLike = { r: 0, g: 0, b: 0, a: 0 })
    {
        this.init(width, height, fillcolor);
    }

    /**
     * 初始化
     * @param width 宽度
     * @param height 高度
     * @param fillcolor 填充颜色
     */
    init(width = 1, height = 1, fillcolor: ImageUtilColorLike = { r: 0, g: 0, b: 0, a: 0 })
    {
        this.imageData = new ImageData(width, height);
        this.fillRect({ x: 0, y: 0, width, height }, fillcolor);
    }

    /**
     * 获取图片数据
     * @param image 加载完成的图片元素
     */
    fromImage(image: HTMLImageElement)
    {
        if (!image) return null;
        const canvasImg = document.createElement('canvas');
        canvasImg.width = image.width;
        canvasImg.height = image.height;

        const ctxt = canvasImg.getContext('2d');

        if (!ctxt)
        {
            throw new Error('ImageUtil.fromImage：无法创建 2D 画布上下文');
        }

        ctxt.drawImage(image, 0, 0);
        this.imageData = ctxt.getImageData(0, 0, image.width, image.height);// 读取整张图片的像素。

        return this;
    }

    /**
     * 绘制图片数据指定位置颜色
     * @param x 图片数据x坐标
     * @param y 图片数据y坐标
     * @param color 颜色值
     */
    drawPixel(x: number, y: number, color: ImageUtilColorLike)
    {
        const oldColor = this.getPixel(x, y);
        const c = normalizeColor(color);
        // 旧实现是 `oldColor.mix(color, color.a)`（math class 的 mix 对含 alpha 的**所有分量**插值）：
        // 逐分量 old*(1-a) + color*a
        this.setPixel(x, y, {
            r: oldColor.r * (1 - c.a) + c.r * c.a,
            g: oldColor.g * (1 - c.a) + c.g * c.a,
            b: oldColor.b * (1 - c.a) + c.b * c.a,
            a: oldColor.a * (1 - c.a) + c.a * c.a,
        });

        return this;
    }

    /**
     * 获取图片指定位置颜色值
     * @param x 图片数据x坐标
     * @param y 图片数据y坐标
     */
    getPixel(x: number, y: number): NormalizedColor
    {
        const pos = (x + y * this.imageData.width) * 4;

        return {
            r: this.imageData.data[pos] / 255,
            g: this.imageData.data[pos + 1] / 255,
            b: this.imageData.data[pos + 2] / 255,
            a: this.imageData.data[pos + 3] / 255,
        };
    }

    /**
     * 设置指定位置颜色值
     * @param imageData 图片数据
     * @param x 图片数据x坐标
     * @param y 图片数据y坐标
     * @param color 颜色值
     */
    setPixel(x: number, y: number, color: ImageUtilColorLike)
    {
        x = Math.round(x);
        y = Math.round(y);
        const pos = (x + y * this.imageData.width) * 4;
        const c = normalizeColor(color);

        this.imageData.data[pos] = c.r * 255;
        this.imageData.data[pos + 1] = c.g * 255;
        this.imageData.data[pos + 2] = c.b * 255;
        this.imageData.data[pos + 3] = c.a * 255;

        return this;
    }

    /**
     * 清理图片数据
     * @param clearColor 清理时填充颜色
     */
    clear(clearColor: ImageUtilColorLike = { r: 0, g: 0, b: 0, a: 0 })
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
     * @param rect 填充的矩形（`RectangleLike`：只需 `x/y/width/height` 的纯数据对象也算，issue #134 阶段 C-a）
     * @param fillcolor 填充颜色
     */
    fillRect(rect: RectangleLike, fillcolor: ImageUtilColorLike = { r: 1, g: 1, b: 1, a: 1 })
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
     * @param start 起始坐标（`Vector2Like`：只需 `x/y` 的纯数据对象也算，issue #134）
     * @param end 终止坐标（同上）
     * @param color 线条颜色
     */
    drawLine(start: Vector2Like, end: Vector2Like, color: ImageUtilColorLike)
    {
        // 参数已放宽为 Vector2Like（没有实例方法）：实现改用 @feng3d/math 的纯函数层，
        // 与原先 `end.subTo(start).length` / `start.lerpNumberTo(end, t, p)` 逐值一致
        const length = vec2Length(vec2Sub(end, start));
        const p = { x: 0, y: 0 };
        for (let i = 0; i <= length; i++)
        {
            vec2LerpNumber(start, end, i / length, p);
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
    drawPoint(x: number, y: number, color: ImageUtilColorLike, size = 1)
    {
        const half = Math.floor(size / 2);
        //
        let sx = x - half; if (sx < 0) sx = 0;
        let ex = x - half + size; if (ex > this.imageData.width) ex = this.imageData.width;
        let sy = y - half; if (sy < 0) sy = 0;
        let ey = y - half + size; if (ey > this.imageData.height) ey = this.imageData.height;
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
        // 原实现是 `new Rectangle(0, 0, w, h).intersection(new Rectangle(x, y, w2, h2))`：
        // class 已删除（issue #134 阶段 C-a），改用纯函数层 `rect2Intersection`（结果与原地语义无关，只是新矩形）
        const rect = rect2Intersection(
            { x: 0, y: 0, width: this.imageData.width, height: this.imageData.height },
            { x, y, width: imageData.width, height: imageData.height },
        );

        const imageUtil = new ImageUtil(); imageUtil.imageData = imageData;
        for (let i = rect.x; i < rect.x + rect.width; i++)
        {
            for (let j = rect.y; j < rect.y + rect.height; j++)
            {
                const c = imageUtil.getPixel(i - x, j - y);
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
        const imageData = new ImageData(size, size);

        const half = size / 2;
        for (let i = 0; i < size; i++)
        {
            for (let j = 0; j < size; j++)
            {
                const l = mathUtil.clamp(new Vector2(i - half, j - half).length, 0, half) / half;
                let f = 1 - l;
                f = f * f;

                const pos = (i + j * size) * 4;
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
        const leftTop = { r: 1, g: 1, b: 1 };
        const rightTop = rgbFromUnit(color);
        const leftBottom = { r: 0, g: 0, b: 0 };
        const rightBottom = { r: 0, g: 0, b: 0 };

        //
        for (let i = 0; i < this.imageData.width; i++)
        {
            for (let j = 0; j < this.imageData.height; j++)
            {
                const top = mixRgb(leftTop, rightTop, i / this.imageData.width);
                const bottom = mixRgb(leftBottom, rightBottom, i / this.imageData.width);
                const v = mixRgb(top, bottom, j / this.imageData.height);

                this.setPixel(i, j, { ...v, a: 1 });
            }
        }

        return this;
    }

    drawColorRect(color: ImageUtilColorLike)
    {
        const c = normalizeColor(color);
        const colorHeight = Math.floor(this.imageData.height * 0.8);
        const alphaWidth = Math.floor(c.a * this.imageData.width);

        // 旧实现 `const color4 = color.clone(); color4.a = 1;`
        const color4 = { r: c.r, g: c.g, b: c.b, a: 1 };
        const white = { r: 1, g: 1, b: 1, a: 1 };
        const black = { r: 0, g: 0, b: 0, a: 1 };
        //
        for (let i = 0; i < this.imageData.width; i++)
        {
            for (let j = 0; j < this.imageData.height; j++)
            {
                //
                if (j <= colorHeight)
                {
                    this.setPixel(i, j, color4);
                }
                else
                {
                    this.setPixel(i, j, i < alphaWidth ? white : black);
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
                const c = gradient.getValue(dirw ? i / (this.imageData.width - 1) : j / (this.imageData.height - 1));

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
    drawCurve(curve: AnimationCurve, between0And1: boolean, color: ImageUtilColorLike, rect: RectangleLike | null = null)
    {
        rect = rect || { x: 0, y: 0, width: this.imageData.width, height: this.imageData.height };
        const range = between0And1 ? [1, 0] : [1, -1];

        const prepos = new Vector2();
        const curpos = new Vector2();
        //
        for (let i = 0; i < rect.width; i++)
        {
            //
            let y = curve.getValue(i / (rect.width - 1));

            y = mathUtil.mapLinear(y, range[0], range[1], 0, 1);

            const j = Math.round(y * (rect.height - 1));

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
    drawBetweenTwoCurves(curve: AnimationCurve, curve1: AnimationCurve, between0And1: boolean, curveColor: ImageUtilColorLike = { r: 1, g: 1, b: 1, a: 1 }, fillcolor: ImageUtilColorLike = { r: 1, g: 1, b: 1, a: 0.5 }, rect: RectangleLike | null = null)
    {
        rect = rect || { x: 0, y: 0, width: this.imageData.width, height: this.imageData.height };
        const range = between0And1 ? [1, 0] : [1, -1];

        const prepos0 = new Vector2();
        const curpos0 = new Vector2();
        const prepos1 = new Vector2();
        const curpos1 = new Vector2();
        //
        for (let i = 0; i < rect.width; i++)
        {
            //
            let y0 = curve.getValue(i / (rect.width - 1));
            let y1 = curve1.getValue(i / (rect.width - 1));

            y0 = mathUtil.mapLinear(y0, range[0], range[1], 0, 1);
            y1 = mathUtil.mapLinear(y1, range[0], range[1], 0, 1);

            y0 = Math.round(y0 * (rect.height - 1));
            y1 = Math.round(y1 * (rect.height - 1));

            curpos0.x = rect.x + i;
            curpos0.y = rect.y + y0;
            curpos1.x = rect.x + i;
            curpos1.y = rect.y + y1;

            this.drawLine({ x: rect.x + i, y: rect.y + y0 }, { x: rect.x + i, y: rect.y + y1 }, fillcolor);
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
    clearBackColor(backColor: ImageUtilColorLike)
    {
        const back = normalizeColor(backColor);

        for (let i = 0; i < this.imageData.width; i++)
        {
            for (let j = 0; j < this.imageData.height; j++)
            {
                const t = this.getPixel(i, j);
                const a = 1 - t.r / back.r;
                t.r = t.g = t.b = 0;
                t.a = a;
                this.setPixel(i, j, t);
            }
        }
    }
}
