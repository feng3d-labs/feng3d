import { mathUtil } from '@feng3d/polyfill';
import { seg3IntersectionWithLine } from './intersectionOps';
import { Line3 } from './Line3';
import { Vector3 } from './Vector3';
import {
    seg3ClampPoint,
    seg3Copy,
    seg3Equals,
    seg3FromPoints,
    seg3GetLength,
    seg3GetLengthSquared,
    seg3GetNormalWithPoint,
    seg3GetPoint,
    seg3GetPointDistance,
    seg3GetPointDistanceSquare,
    seg3GetPositionByPoint,
    seg3OnWithPoint,
    seg3ProjectOnWithPoint,
    seg3Random,
} from './segment3Ops';

/**
 * 3D线段
 */
export class Segment3
{
    /**
     * 初始化线段
     * @param p0
     * @param p1
     */
    static fromPoints(p0: Vector3, p1: Vector3)
    {
        return new Segment3(p0, p1);
    }

    /**
     * 随机线段
     */
    static random()
    {
        return new Segment3(Vector3.random(), Vector3.random());
    }

    /**
     * 将当前线段端点初始化为随机值（修改 this 并返回）
     */
    random()
    {
        seg3Random(this);

        return this;
    }

    /**
     * 线段起点
     */
    p0: Vector3;
    /**
     * 线段终点
     */
    p1: Vector3;

    constructor(p0 = new Vector3(), p1 = new Vector3())
    {
        this.p0 = p0;
        this.p1 = p1;
    }

    /**
     * 从两点初始化线段（修改 this 并返回）
     */
    fromPoints(p0: Vector3, p1: Vector3)
    {
        seg3FromPoints(p0, p1, this);

        return this;
    }

    /**
     * 线段长度
     */
    getLength()
    {
        return seg3GetLength(this);
    }

    /**
     * 线段长度的平方
     */
    getLengthSquared()
    {
        return seg3GetLengthSquared(this);
    }

    /**
     * 获取线段所在直线
     *
     * 留在 class 内（阶段 C 收口）：返回的是 **`Line3` 实例**——纯函数层只产出普通字面量，
     * 装配回 class 会丢原型，要等阶段 C 的构造器收口。
     * `line3Ops.ts` 自 A2h 起就已就绪，**不是**这里的阻塞点。
     */
    getLine(line = new Line3())
    {
        return line.fromPoints(this.p0.clone(), this.p1.clone());
    }

    /**
     * 获取指定位置上的点，当position=0时返回p0，当position=1时返回p1
     * @param position 线段上的位置
     */
    getPoint(position: number, pout = new Vector3()): Vector3
    {
        seg3GetPoint(this, position, pout);

        return pout;
    }

    /**
     * 判定点是否在线段上
     * @param point
     */
    onWithPoint(point: Vector3, precision = mathUtil.PRECISION)
    {
        return seg3OnWithPoint(this, point, precision);
    }

    /**
     * 判定点是否投影在线段上
     * @param point
     */
    projectOnWithPoint(point: Vector3)
    {
        return seg3ProjectOnWithPoint(this, point);
    }

    /**
     * 获取点在线段上的位置，当点投影在线段上p0位置时返回0，当点投影在线段p1上时返回1
     * @param point 点
     */
    getPositionByPoint(point: Vector3)
    {
        return seg3GetPositionByPoint(this, point);
    }

    /**
     * 获取直线到点的法线（线段到点垂直方向）
     * @param point 点
     */
    getNormalWithPoint(point: Vector3)
    {
        const result = new Vector3();

        seg3GetNormalWithPoint(this, point, result);

        return result;
    }

    /**
     * 指定点到该线段距离，如果投影点不在线段上时，该距离为指定点到最近的线段端点的距离
     * @param point 指定点
     */
    getPointDistanceSquare(point: Vector3)
    {
        return seg3GetPointDistanceSquare(this, point);
    }

    /**
     * 指定点到该线段距离，如果投影点不在线段上时，该距离为指定点到最近的线段端点的距离
     * @param point 指定点
     */
    getPointDistance(point: Vector3)
    {
        return seg3GetPointDistance(this, point);
    }

    /**
     * 与直线相交
     * @param line 直线
     *
     * **阶段 C-a 起委托给纯函数 `seg3IntersectionWithLine`**（`./intersectionOps`）：
     * 判别字段（`'p0' in r` = 与线段重合）替代了原来的 `instanceof Line3`。
     * `this.getLine()` 的 `Line3` 实例在纯函数层换成 `line3FromPoints` 的字面量；
     * 装配回实例（`this.clone()` / `new Vector3(...)`）保证**对外的原型语义逐字不变**。
     */
    intersectionWithLine(line: Line3)
    {
        const r = seg3IntersectionWithLine(this, line);

        if (!r) return null;
        if ('p0' in r)
        { return this.clone(); }

        return new Vector3(r.x, r.y, r.z);
    }

    /**
     * 与线段相交
     * @param segment 直线
     *
     * 留在 class 内（阶段 C 收口）：返回值是 `Segment3 | Vector3 | null` 的**联合类型**，
     * 靠 `instanceof Segment3` 判别，且退化分支要 `Segment3.fromPoints` **装配回 class 实例**，
     * 纯函数化要等阶段 C 的 `__type__` 判别字段与构造器收口。`line3Ops.ts` 自 A2h 起就已就绪，**不是**阻塞点。
     */
    intersectionWithSegment(segment: Segment3)
    {
        const r = this.intersectionWithLine(segment.getLine());

        if (!r) return null;
        if (r instanceof Segment3)
        {
            const ps = [this.p0, this.p1].map((p) =>
                segment.clampPoint(p));

            if (this.onWithPoint(ps[0]))
            { return Segment3.fromPoints(ps[0], ps[1]); }

            return null;
        }
        if (this.onWithPoint(r))
        { return r; }

        return null;
    }

    /**
     * 与指定点最近的点
     * @param point 点
     * @param vout 输出点
     *
     * 留在 class 内（阶段 C 收口）：经 `getLine()` 传递依赖上面那条阻塞（`getLine` 要产出 `Line3` 实例）——
     * 它自己用的 `Line3.closestPointWithPoint` 早在 A2h 就委托给 `line3ClosestPointWithPoint` 了。
     */
    closestPointWithPoint(point: Vector3, vout = new Vector3())
    {
        this.getLine().closestPointWithPoint(point, vout);
        if (this.onWithPoint(vout))
        { return vout; }
        if (point.distanceSquared(this.p0) < point.distanceSquared(this.p1))
        { return vout.copy(this.p0); }

        return vout.copy(this.p1);
    }

    /**
     * 把点压缩到线段内
     */
    clampPoint(point: Vector3, pout = new Vector3())
    {
        seg3ClampPoint(this, point, pout);

        return pout;
    }

    /**
     * 判定线段是否相等
     */
    equals(segment: Segment3)
    {
        return seg3Equals(this, segment);
    }

    /**
     * 复制
     */
    copy(segment: Segment3)
    {
        seg3Copy(segment, this);

        return this;
    }

    /**
     * 克隆
     */
    clone()
    {
        const result = new Segment3();

        seg3Copy(this, result);

        return result;
    }
}
