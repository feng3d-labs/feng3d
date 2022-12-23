import { oav } from '../../objectview/ObjectView';
import { mathUtil } from '../../polyfill/MathUtil';
import { Serializable } from '../../serialization/Serializable';
import { serialize } from '../../serialization/serialize';
import { Vector } from './Vector';

/**
 * 二维向量和点的表示。
 */
@Serializable()
export class Vector2 implements Vector
{
    __class__: 'Vector2';

    /**
     * 原点 Vector2(0,0)
     */
    static get ZERO()
    {
        this._ZERO ||= Object.freeze(new Vector2());
        return this._ZERO;
    }
    private static _ZERO: Vector2;

    /**
     * 向量的X分量。
     */
    @oav()
    @serialize
    x: number;

    /**
     * 向量的Y分量。
     */
    @oav()
    @serialize
    y: number;

    /**
     * 向量的长度。
     */
    get length(): number
    {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }

    /**
     * 向量长度的平方。
     */
    get lengthSquared(): number
    {
        return (this.x * this.x) + (this.y * this.y);
    }

    /**
     * 向量的长度。
     */
    get magnitude()
    {
        return this.length;
    }

    /**
     * 向量长度的平方。
     */
    get sqrMagnitude(): number
    {
        return (this.x * this.x) + (this.y * this.y);
    }

    /**
     * 返回大小为 1 的此向量（只读）。
     *
     * 归一化后，向量保持相同的方向，但其长度为 1.0。
     *
     * 请注意，当前向量不变，并返回一个新的归一化向量。如果要对当前向量进行归一化，请使用Normalize函数。
     *
     * 如果向量太小而无法归一化，则将返回零向量。
     */
    get normalized()
    {
        const v = new Vector2(this.x, this.y);
        v.normalize();

        return v;
    }

    /**
     * 用给定的 x, y 分量构造一个新向量。
     *
     * @param x 向量的X分量。
     * @param y 向量的Y分量。
     */
    constructor(x = 0, y = 0)
    {
        this.x = x;
        this.y = y;
    }

    /**
     * 设置现有Vector2的x和y分量。
     *
     * @param x 向量的新的X分量
     * @param y 向量的新的Y分量
     */
    set(x: number, y: number)
    {
        this.x = x;
        this.y = y;

        return this;
    }

    /**
     * 随机
     */
    random()
    {
        this.x = Math.random();
        this.y = Math.random();

        return this;
    }

    /**
     * 判断与给定向量是否相等。
     *
     * @param other 给定的向量。
     * @param precision 比较精度。
     * @returns 如果给定向量完全等于该向量，则返回 true。
     */
    equals(other: Vector2, precision = mathUtil.PRECISION)
    {
        if (!mathUtil.equals(this.x - other.x, 0, precision))
        {
            return false;
        }
        if (!mathUtil.equals(this.y - other.y, 0, precision))
        {
            return false;
        }

        return true;
    }

    /**
     * 使该向量的大小为 1。
     *
     * 归一化后，向量保持相同的方向，但其长度为 1.0。
     *
     * 请注意，此函数将更改当前向量。如果要保持当前向量不变，请使用归一化变量。
     *
     * 如果这个向量太小而无法归一化，它将被设置为零。
     */
    normalize()
    {
        const length = this.length;
        if (this.length > mathUtil.PRECISION)
        {
            this.x /= length;
            this.y /= length;
        }
        else
        {
            this.x = 0;
            this.y = 0;
        }
    }

    /**
     * 克隆点对象
     */
    clone(): Vector2
    {
        return new Vector2(this.x, this.y);
    }

    /**
     * 返回此向量的格式化字符串。
     */
    toString(): string
    {
        return `(${this.x}, ${this.y})`;
    }

    /**
     * 将另一个点的坐标添加到此点的坐标。
     * @param v 要添加的点。
     */
    add(v: Vector2): Vector2
    {
        this.x += v.x;
        this.y += v.y;

        return this;
    }

    /**
     * 将另一个点的坐标添加到此点的坐标以创建一个新点。
     * @param v 要添加的点。
     * @returns 新点。
     */
    addTo(v: Vector2, vOut = new Vector2())
    {
        vOut.x = this.x + v.x;
        vOut.y = this.y + v.y;

        return vOut;
    }

    /**
     * 从此点的坐标中减去另一个点的坐标以创建一个新点。
     * @param v 要减去的点。
     * @returns 新点。
     */
    sub(v: Vector2)
    {
        this.x -= v.x;
        this.y -= v.y;

        return this;
    }

    /**
     * 减去向量返回新向量
     * @param v 减去的向量
     * @returns 返回的新向量
     */
    subTo(v: Vector2, vOut = new Vector2())
    {
        vOut.x = this.x - v.x;
        vOut.y = this.y - v.y;

        return vOut;
    }

    /**
     * 乘以向量
     * @param v 向量
     */
    multiply(v: Vector2)
    {
        this.x *= v.x;
        this.y *= v.y;

        return this;
    }

    /**
     * 乘以向量
     * @param v 向量
     * @param vOut 输出向量
     */
    multiplyTo(v: Vector2, vOut = new Vector2())
    {
        vOut.x = this.x * v.x;
        vOut.y = this.y * v.y;

        return vOut;
    }

    /**
     * 除以向量
     * @param v 向量
     */
    divide(v: Vector2)
    {
        this.x /= v.x;
        this.y /= v.y;

        return this;
    }

    /**
     * 除以向量
     * @param v 向量
     * @param vOut 输出向量
     */
    divideTo(v: Vector2, vOut = new Vector2())
    {
        vOut.x = this.x / v.x;
        vOut.y = this.y / v.y;

        return vOut;
    }

    /**
     * 点乘、点积
     *
     * 描述两个向量的朝向靠近程度，值越大越靠近，夹角越小。
     *
     * @param v 向量。
     */
    dot(v: Vector2)
    {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * 叉乘、叉积
     *
     * 叉乘结果为两个向量组成的三角形的一半面积。
     *
     * @param v 向量。
     */
    cross(v: Vector2)
    {
        return this.x * v.y - this.y * v.x;
    }

    /**
     * 将源 Vector2 对象中的所有点数据复制到调用方 Vector2 对象中。
     * @param source 要从中复制数据的 Vector2 对象。
     */
    copy(source: Vector2)
    {
        this.x = source.x;
        this.y = source.y;

        return this;
    }

    /**
     * 返回与目标点之间的距离。
     * @param p 目标点
     * @returns 与目标点之间的距离。
     */
    distance(p: Vector2)
    {
        const dx = this.x - p.x;
        const dy = this.y - p.y;

        return Math.sqrt((dx * dx) + (dy * dy));
    }

    /**
     * 与目标点之间的距离平方
     * @param p 目标点
     */
    distanceSquared(p: Vector2)
    {
        const dx = this.x - p.x;
        const dy = this.y - p.y;

        return (dx * dx) + (dy * dy);
    }

    /**
     * 负向量
     */
    negate()
    {
        this.x *= -1;
        this.y *= -1;

        return this;
    }

    /**
     * 倒数向量。
     * (x,y) -> (1/x,1/y)
     */
    reciprocal()
    {
        this.x = 1 / this.x;
        this.y = 1 / this.y;

        return this;
    }

    /**
     * 倒数向量。
     * (x,y) -> (1/x,1/y)
     */
    reciprocalTo(out = new Vector2())
    {
        out.copy(this).reciprocal();

        return out;
    }

    /**
     * 按标量（大小）缩放当前的 Vector3 对象。
     */
    scaleNumber(s: number): Vector2
    {
        this.x *= s;
        this.y *= s;

        return this;
    }
    /**
     * 按标量（大小）缩放当前的 Vector2 对象。
     */
    scaleNumberTo(s: number, vOut = new Vector2())
    {
        return vOut.copy(this).scaleNumber(s);
    }

    /**
     * 缩放
     * @param s 缩放量
     */
    scale(s: Vector2)
    {
        this.x *= s.x;
        this.y *= s.y;

        return this;
    }

    /**
     * 缩放
     * @param s 缩放量
     */
    scaleTo(s: Vector2, vOut = new Vector2())
    {
        if (s === vOut) s = s.clone();

        return vOut.copy(this).scale(s);
    }

    /**
     * 按指定量偏移 Vector2 对象。dx 的值将添加到 x 的原始值中以创建新的 x 值。dy 的值将添加到 y 的原始值中以创建新的 y 值。
     * @param dx 水平坐标 x 的偏移量。
     * @param dy 水平坐标 y 的偏移量。
     */
    offset(dx: number, dy: number): Vector2
    {
        this.x += dx;
        this.y += dy;

        return this;
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回自身
     */
    lerp(p: Vector2, alpha: Vector2): Vector2
    {
        this.x += (p.x - this.x) * alpha.x;
        this.y += (p.y - this.y) * alpha.y;

        return this;
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回新向量
     */
    lerpTo(v: Vector2, alpha: Vector2, vOut = new Vector2())
    {
        return vOut.copy(this).lerp(v, alpha);
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回自身
     */
    lerpNumber(v: Vector2, alpha: number)
    {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;

        return this;
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回自身
     */
    lerpNumberTo(v: Vector2, alpha: number, vOut = new Vector2())
    {
        return vOut.copy(this).lerpNumber(v, alpha);
    }

    /**
     * 夹紧？
     * @param min 最小值
     * @param max 最大值
     */
    clamp(min: Vector2, max: Vector2)
    {
        this.x = mathUtil.clamp(this.x, min.x, max.x);
        this.y = mathUtil.clamp(this.y, min.y, max.y);

        return this;
    }

    /**
     * 夹紧？
     * @param min 最小值
     * @param max 最大值
     */
    clampTo(min: Vector2, max: Vector2, vOut = new Vector2())
    {
        return vOut.copy(this).clamp(min, max);
    }

    /**
     * 取最小元素
     * @param v 向量
     */
    min(v: Vector2)
    {
        this.x = Math.min(this.x, v.x);
        this.y = Math.min(this.y, v.y);

        return this;
    }

    /**
     * 取最大元素
     * @param v 向量
     */
    max(v: Vector2)
    {
        this.x = Math.max(this.x, v.x);
        this.y = Math.max(this.y, v.y);

        return this;
    }

    /**
     * 各分量均取最近的整数
     */
    round()
    {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        return this;
    }

    /**
     * 转换为数组
     * @param array 数组
     * @param offset 偏移
     * @returns 返回数组
     */
    toArray(array: number[] = [], offset = 0)
    {
        array[offset] = this.x;
        array[offset + 1] = this.y;

        return array;
    }
}
