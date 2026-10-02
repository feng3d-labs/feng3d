import { Vector2 } from './Vector2';
import {
    rect2ClampPoint,
    rect2Contains,
    rect2ContainsPoint,
    rect2ContainsRect,
    rect2Copy,
    rect2Equals,
    rect2From,
    rect2GetBottom,
    rect2GetBottomRight,
    rect2GetCenter,
    rect2GetLeft,
    rect2GetRight,
    rect2GetSize,
    rect2GetTop,
    rect2GetTopLeft,
    rect2Inflate,
    rect2InflatePoint,
    rect2Intersection,
    rect2Intersects,
    rect2IsEmpty,
    rect2Offset,
    rect2OffsetPoint,
    rect2SetBottom,
    rect2SetBottomRight,
    rect2SetEmpty,
    rect2SetLeft,
    rect2SetRight,
    rect2SetTop,
    rect2SetTopLeft,
    rect2ToString,
    rect2Union,
} from './rectangleOps';
import type { RectangleLike } from './rectangleOps';

/**
 * 矩形的**只读**字段形状。
 *
 * 现在就是纯函数层 `RectangleLike` 的别名（`Issue #134` 阶段 A2m）：
 * 唯一的消费点是 `Rectangle.copyFrom`，而纯函数层入参就是只读的形状类型。
 * 字段由「可写」收紧为 `readonly` 与数据层规范一致（AGENTS §8.5）——注意这**确实是类型层面的收紧**，
 * 若有外部代码在写 `IRectangle` 的字段会编译不过（本仓实测无消费点）。
 */
export type IRectangle = RectangleLike;

/**
 * 矩形
 *
 * Rectangle 对象是按其位置（由它左上角的点 (x, y) 确定）以及宽度和高度定义的区域。<br/>
 * Rectangle 类的 x、y、width 和 height 属性相互独立；更改一个属性的值不会影响其他属性。
 * 但是，right 和 bottom 属性与这四个属性是整体相关的。例如，如果更改 right 属性的值，则 width
 * 属性的值将发生变化；如果更改 bottom 属性，则 height 属性的值将发生变化。
 *
 * 运算已抽出为纯函数层（issue #134 阶段 A2m，见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）：
 * 方法体一律转发到 `./rectangleOps`，`out` 传 `this` 即保留就地语义。
 * **getter / setter 也一并委托**（它们不是简单字段读写：`right` setter 只改 `width`、
 * `left` setter 同时改 `x` 与 `width`），委托后仍是「赋值改 `this`、读取返回新对象」的既有形态。
 */
export class Rectangle
{
    /**
     * 创建一个新 Rectangle 对象，其左上角由 x 和 y 参数指定，并具有指定的 width 和 height 参数。
     * @param x 矩形左上角的 x 坐标。
     * @param y 矩形左上角的 y 坐标。
     * @param width 矩形的宽度（以像素为单位）。
     * @param height 矩形的高度（以像素为单位）。
     */
    constructor(x = 0, y = 0, width = 0, height = 0)
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * 矩形左上角的 x 坐标。
     * @default 0
     */
    x: number;

    /**
     * 矩形左上角的 y 坐标。
     * @default 0
     */
    y: number;

    /**
     * 矩形的宽度（以像素为单位）。
     * @default 0
     */
    width: number;
    /**
     * 矩形的高度（以像素为单位）。
     * @default 0
     */
    height: number;

    /**
     * x 和 width 属性的和。
     */
    get right(): number
    {
        return rect2GetRight(this);
    }

    set right(value: number)
    {
        rect2SetRight(this, value, this);
    }

    /**
     * y 和 height 属性的和。
     */
    get bottom(): number
    {
        return rect2GetBottom(this);
    }

    set bottom(value: number)
    {
        rect2SetBottom(this, value, this);
    }

    /**
     * 矩形左上角的 x 坐标。更改 Rectangle 对象的 left 属性对 y 和 height 属性没有影响。但是，它会影响 width 属性，而更改 x 值不会影响 width 属性。
     * left 属性的值等于 x 属性的值。
     */
    get left(): number
    {
        return rect2GetLeft(this);
    }

    set left(value: number)
    {
        rect2SetLeft(this, value, this);
    }

    /**
     * 矩形左上角的 y 坐标。更改 Rectangle 对象的 top 属性对 x 和 width 属性没有影响。但是，它会影响 height 属性，而更改 y 值不会影响 height 属性。<br/>
     * top 属性的值等于 y 属性的值。
     */
    get top(): number
    {
        return rect2GetTop(this);
    }

    set top(value: number)
    {
        rect2SetTop(this, value, this);
    }

    /**
     * 由该点的 x 和 y 坐标确定的 Rectangle 对象左上角的位置。
     *
     * 每次读取都返回**新的** Vector2（与改造前一致）。
     */
    get topLeft(): Vector2
    {
        const result = new Vector2();

        rect2GetTopLeft(this, result);

        return result;
    }

    set topLeft(value: Vector2)
    {
        rect2SetTopLeft(this, value, this);
    }

    /**
     * 由 right 和 bottom 属性的值确定的 Rectangle 对象的右下角的位置。
     *
     * 每次读取都返回**新的** Vector2（与改造前一致）。
     */
    get bottomRight(): Vector2
    {
        const result = new Vector2();

        rect2GetBottomRight(this, result);

        return result;
    }

    set bottomRight(value: Vector2)
    {
        rect2SetBottomRight(this, value, this);
    }

    /**
     * 中心点
     *
     * 每次读取都返回**新的** Vector2（与改造前一致）。
     */
    get center(): Vector2
    {
        const result = new Vector2();

        rect2GetCenter(this, result);

        return result;
    }

    /**
     * 将源 Rectangle 对象中的所有矩形数据复制到调用方 Rectangle 对象中。
     * @param sourceRect 要从中复制数据的 Rectangle 对象。
     */
    copyFrom(sourceRect: IRectangle): Rectangle
    {
        rect2Copy(sourceRect, this);

        return this;
    }

    /**
     * 将 Rectangle 的成员设置为指定值
     * @param x 矩形左上角的 x 坐标。
     * @param y 矩形左上角的 y 坐标。
     * @param width 矩形的宽度（以像素为单位）。
     * @param height 矩形的高度（以像素为单位）。
     */
    init(x: number, y: number, width: number, height: number): Rectangle
    {
        rect2From(x, y, width, height, this);

        return this;
    }

    /**
     * 确定由此 Rectangle 对象定义的矩形区域内是否包含指定的点。
     * @param x 检测点的x轴
     * @param y 检测点的y轴
     * @returns 如果检测点位于矩形内，返回true，否则，返回false
     */
    contains(x: number, y: number): boolean
    {
        return rect2Contains(this, x, y);
    }

    /**
     * 如果在 toIntersect 参数中指定的 Rectangle 对象与此 Rectangle 对象相交，则返回交集区域作为 Rectangle 对象。如果矩形不相交，
     * 则此方法返回一个空的 Rectangle 对象，其属性设置为 0。
     * @param toIntersect 要对照比较以查看其是否与此 Rectangle 对象相交的 Rectangle 对象。
     * @returns 等于交集区域的 Rectangle 对象。如果该矩形不相交，则此方法返回一个空的 Rectangle 对象；即，其 x、y、width 和
     * height 属性均设置为 0 的矩形。
     */
    intersection(toIntersect: Rectangle): Rectangle
    {
        const result = new Rectangle();

        rect2Intersection(this, toIntersect, result);

        return result;
    }

    /**
     * 按指定量增加 Rectangle 对象的大小（以像素为单位）
     * 保持 Rectangle 对象的中心点不变，使用 dx 值横向增加它的大小，使用 dy 值纵向增加它的大小。
     * @param dx Rectangle 对象横向增加的值。
     * @param dy Rectangle 对象纵向增加的值。
     */
    inflate(dx: number, dy: number): void
    {
        rect2Inflate(this, dx, dy, this);
    }

    /**
     * 确定在 toIntersect 参数中指定的对象是否与此 Rectangle 对象相交。此方法检查指定的 Rectangle
     * 对象的 x、y、width 和 height 属性，以查看它是否与此 Rectangle 对象相交。
     * @param toIntersect 要与此 Rectangle 对象比较的 Rectangle 对象。
     * @returns 如果两个矩形相交，返回true，否则返回false
     */
    intersects(toIntersect: Rectangle): boolean
    {
        return rect2Intersects(this, toIntersect);
    }

    /**
     * 确定此 Rectangle 对象是否为空。
     * @returns 如果 Rectangle 对象的宽度或高度小于等于 0，则返回 true 值，否则返回 false。
     */
    isEmpty(): boolean
    {
        return rect2IsEmpty(this);
    }

    /**
     * 将 Rectangle 对象的所有属性设置为 0。
     */
    setEmpty(): void
    {
        rect2SetEmpty(this);
    }

    /**
     * 返回一个新的 Rectangle 对象，其 x、y、width 和 height 属性的值与原始 Rectangle 对象的对应值相同。
     * @returns 新的 Rectangle 对象，其 x、y、width 和 height 属性的值与原始 Rectangle 对象的对应值相同。
     */
    clone(): Rectangle
    {
        const result = new Rectangle();

        rect2Copy(this, result);

        return result;
    }

    /**
     * 确定由此 Rectangle 对象定义的矩形区域内是否包含指定的点。
     * 此方法与 Rectangle.contains() 方法类似，只不过它采用 Point 对象作为参数。
     * @param point 包含点对象
     * @returns 如果包含，返回true，否则返回false
     */
    containsPoint(point: Vector2): boolean
    {
        return rect2ContainsPoint(this, point);
    }

    /**
     * 确定此 Rectangle 对象内是否包含由 rect 参数指定的 Rectangle 对象。
     * 如果一个 Rectangle 对象完全在另一个 Rectangle 的边界内，我们说第二个 Rectangle 包含第一个 Rectangle。
     * @param rect 所检查的 Rectangle 对象
     * @returns 如果此 Rectangle 对象包含您指定的 Rectangle 对象，则返回 true 值，否则返回 false。
     */
    containsRect(rect: Rectangle): boolean
    {
        return rect2ContainsRect(this, rect);
    }

    /**
     * 确定在 toCompare 参数中指定的对象是否等于此 Rectangle 对象。
     * 此方法将某个对象的 x、y、width 和 height 属性与此 Rectangle 对象所对应的相同属性进行比较。
     * @param toCompare 要与此 Rectangle 对象进行比较的矩形。
     * @returns 如果对象具有与此 Rectangle 对象完全相同的 x、y、width 和 height 属性值，则返回 true 值，否则返回 false。
     */
    equals(toCompare: Rectangle): boolean
    {
        return rect2Equals(this, toCompare);
    }

    /**
     * 增加 Rectangle 对象的大小。此方法与 Rectangle.inflate() 方法类似，只不过它采用 Point 对象作为参数。
     */
    inflatePoint(point: Vector2): void
    {
        rect2InflatePoint(this, point, this);
    }

    /**
     * 按指定量调整 Rectangle 对象的位置（由其左上角确定）。
     * @param dx 将 Rectangle 对象的 x 值移动此数量。
     * @param dy 将 Rectangle 对象的 t 值移动此数量。
     */
    offset(dx: number, dy: number): void
    {
        rect2Offset(this, dx, dy, this);
    }

    /**
     * 将 Point 对象用作参数来调整 Rectangle 对象的位置。此方法与 Rectangle.offset() 方法类似，只不过它采用 Point 对象作为参数。
     * @param point 要用于偏移此 Rectangle 对象的 Point 对象。
     */
    offsetPoint(point: Vector2): void
    {
        rect2OffsetPoint(this, point, this);
    }

    /**
     * 生成并返回一个字符串，该字符串列出 Rectangle 对象的水平位置和垂直位置以及高度和宽度。
     * @returns 一个字符串，它列出了 Rectangle 对象的下列各个属性的值：x、y、width 和 height。
     */
    toString(): string
    {
        return rect2ToString(this);
    }

    /**
     * 通过填充两个矩形之间的水平和垂直空间，将这两个矩形组合在一起以创建一个新的 Rectangle 对象。
     * @param toUnion 要添加到此 Rectangle 对象的 Rectangle 对象。
     * @returns 充当两个矩形的联合的新 Rectangle 对象。
     */
    union(toUnion: Rectangle): Rectangle
    {
        const result = new Rectangle();

        rect2Union(this, toUnion, result);

        return result;
    }

    /**
     *
     * @param point 点
     * @param pout 输出点
     */
    clampPoint(point: Vector2, pout = new Vector2())
    {
        rect2ClampPoint(this, point, pout);

        return pout;
    }

    /**
     * The size of the Rectangle object, expressed as a Point object with the
     * values of the <code>width</code> and <code>height</code> properties.
     */
    public get size(): Vector2
    {
        const result = new Vector2();

        rect2GetSize(this, result);

        return result;
    }
}
