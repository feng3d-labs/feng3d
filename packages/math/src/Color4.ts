import { mathUtil } from '@feng3d/polyfill';
import { Color3 } from './Color3';
import { Vector4 } from './geom/Vector4';
import {
    color4Copy,
    color4Equals,
    color4FromColor3,
    color4FromUnit,
    color4FromUnit24,
    color4Mix,
    color4Multiply,
    color4MultiplyNumber,
    color4Random,
    color4SetTo,
    color4ToArray,
    color4ToColor3,
    color4ToHexString,
    color4ToInt,
    color4ToRGBA,
    color4ToString,
    color4ToVector4,
} from './color/color4Ops';

declare global
{
    interface MixinsColor3
    {
        toColor4(color4?: Color4): Color4
    }
}

Color3.prototype.toColor4 = function toColor4(color4 = new Color4())
{
    color4.r = this.r;
    color4.g = this.g;
    color4.b = this.b;

    return color4;
};

/**
 * 颜色（包含透明度）
 */
export class Color4
{

    static readonly WHITE = Object.freeze(new Color4(1, 1, 1, 1));
    static readonly BLACK = Object.freeze(new Color4(0, 0, 0, 1));

    static fromUnit(color: number)
    {
        return new Color4().fromUnit(color);
    }

    static fromUnit24(color: number, a = 1)
    {
        return Color4.fromColor3(Color3.fromUnit(color), a);
    }

    static fromColor3(color3: Color3, a = 1)
    {
        return new Color4(color3.r, color3.g, color3.b, a);
    }

    /**
     * 红[0,1]
     */
    r = 1;
    /**
     * 绿[0,1]
     */
    g = 1;
    /**
     * 蓝[0,1]
     */
    b = 1;
    /**
     * 透明度[0,1]
     */
    a = 1;

    /**
     * 构建颜色
     * @param r 红[0,1]
     * @param g 绿[0,1]
     * @param b 蓝[0,1]
     * @param a 透明度[0,1]
     */
    constructor(r = 1, g = 1, b = 1, a = 1)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    setTo(r: number, g: number, b: number, a = 1)
    {
        color4SetTo(r, g, b, a, this);

        return this;
    }

    /**
     * 通过
     * @param color
     */
    fromUnit(color: number)
    {
        color4FromUnit(color, this);

        return this;
    }

    fromUnit24(color: number, a = 1)
    {
        color4FromUnit24(color, a, this);

        return this;
    }

    fromColor3(color3: Color3, a = 1)
    {
        color4FromColor3(color3, a, this);

        return this;
    }

    toInt()
    {
        return color4ToInt(this);
    }

    /**
     * 输出16进制字符串
     */
    toHexString()
    {
        return color4ToHexString(this);
    }

    /**
     * 输出 RGBA 颜色值，例如 rgba(255,255,255,1)
     */
    toRGBA()
    {
        return color4ToRGBA(this);
    }

    /**
     * 混合颜色
     * @param color 混入的颜色
     * @param rate 混入比例
     */
    mix(color: Color4, rate = 0.5)
    {
        color4Mix(this, color, rate, this);

        return this;
    }

    /**
     * 混合颜色
     * @param color 混入的颜色
     * @param rate 混入比例
     */
    mixTo(color: Color4, rate: number, vout = new Color4())
    {
        color4Mix(this, color, rate, vout);

        return vout;
    }

    /**
     * 乘以指定颜色
     * @param c 乘以的颜色
     * @returns 返回自身
     */
    multiply(c: Color4)
    {
        color4Multiply(this, c, this);

        return this;
    }

    /**
     * 乘以指定颜色
     * @param v 乘以的颜色
     * @returns 返回新颜色
     */
    multiplyTo(v: Color4, vout = new Color4())
    {
        color4Multiply(this, v, vout);

        return vout;
    }

    /**
     * 乘以指定常量
     *
     * @param scale 缩放常量
     * @returns 返回自身
     */
    multiplyNumber(scale: number)
    {
        color4MultiplyNumber(this, scale, this);

        return this;
    }

    /**
     * 通过将当前 Color3 对象的 r、g 和 b 元素与指定的 Color3 对象的 r、g 和 b 元素进行比较，确定这两个对象是否相等。
     */
    equals(object: Color4, precision = mathUtil.PRECISION)
    {
        return color4Equals(this, object, precision);
    }

    /**
     * 拷贝
     */
    copy(color: Color4)
    {
        color4Copy(color, this);

        return this;
    }

    /**
     * 输出字符串
     */
    toString(): string
    {
        return color4ToString(this);
    }

    toColor3(color = new Color3())
    {
        color4ToColor3(this, color);

        return color;
    }

    toVector4(vector4 = new Vector4())
    {
        color4ToVector4(this, vector4);

        return vector4;
    }

    /**
     * 转换为数组
     * @param array 数组
     * @param offset 偏移
     */
    toArray(array: number[] = [], offset = 0)
    {
        return color4ToArray(this, array, offset);
    }

    /**
     * 克隆
     */
    clone()
    {
        const result = new Color4();

        color4Copy(this, result);

        return result;
    }

    /**
     * 随机`Color4`
     *
     * @param randomAlpha 透明值是否随机
     */
    random(randomAlpha = false)
    {
        color4Random(randomAlpha, this);

        return this;
    }
}
