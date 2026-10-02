import { mathUtil } from '@feng3d/polyfill';
import { Line3 } from './Line3';
import { Plane } from './Plane';
import { Segment3 } from './Segment3';
import {
    tri3Area,
    tri3BlendWithPoint,
    tri3Copy,
    tri3FromPoints,
    tri3FromPositions,
    tri3GetBarycenter,
    tri3GetBarycentricCoordinates,
    tri3GetCircumcenter,
    tri3GetInnercenter,
    tri3GetNormal,
    tri3GetOrthocenter,
    tri3GetPoint,
    tri3GetPoints,
    tri3GetSegments,
    tri3OnWithPoint,
    tri3Random,
    tri3RandomPoint,
    tri3Rasterize,
    tri3RasterizeCustom,
    tri3ScaleVector3,
    tri3Translate,
} from './triangle3Ops';
import type { Vector3Like } from './vector3Ops';
import { Vector3 } from './Vector3';

/**
 * 把 `triangle3Ops` 返回的纯数据端点还原成 `Vector3` 实例。
 *
 * **不能**把纯数据字面量直接塞进 `new Segment3(...)`：`Segment3` 的部分方法（如 `getLine()`
 * 里的 `this.p0.clone()`）依赖原型上的方法，而纯字面量没有原型，会抛 `clone is not a function`。
 */
function toVector3(v: Vector3Like): Vector3
{
    return new Vector3().copy(v);
}

/**
 * 三角形
 *
 * 自身运算已迁移到纯函数层 `./triangle3Ops`（issue #134 阶段 A2k），本 class 保留为
 * 「数据 + 行为」的兼容外壳，方法体一律委托，**签名 / 返回值 / 就地语义逐字不变**。
 * 依赖 `Plane` 的方法暂留原实现（见各方法上的注释）。
 */
export class Triangle3
{
    /**
     * 通过3顶点定义一个三角形
     * @param p0 点0
     * @param p1 点1
     * @param p2 点2
     */
    static fromPoints(p0: Vector3, p1: Vector3, p2: Vector3)
    {
        // 不能退回 `new Triangle3().fromPoints(...)`：那样缺省构造的三个点会**先**占位，
        // 之后 `tri3FromPoints` 只能把分量复制进去，对象身份就换了。主仓 `Box3.spec.ts`
        // 断言 `triangle.p0 === p0`（`Box3.intersectsTriangle` 会经它就地点顶点），复制会让它失败。
        return new Triangle3(p0, p1, p2);
    }

    /**
     * 从顶点数据初始化三角形
     * @param positions 顶点数据
     */
    static fromPositions(positions: number[])
    {
        return new Triangle3().fromPositions(positions);
    }

    /**
     * 随机三角形
     * @param size 尺寸
     */
    static random(size = 1)
    {
        return new Triangle3(Vector3.random(size), Vector3.random(size), Vector3.random(size));
    }

    /**
     * 将当前三角形三个顶点初始化为随机值（修改 this 并返回）
     */
    random(size = 1): this
    {
        tri3Random(size, this);

        return this;
    }

    /**
     * 三角形0号点
     */
    p0: Vector3;
    /**
     * 三角形1号点
     */
    p1: Vector3;
    /**
     * 三角形2号点
     */
    p2: Vector3;

    /**
     * 构造三角形
     *
     * @param p0 三角形0号点
     * @param p1 三角形1号点
     * @param p2 三角形2号点
     */
    constructor(p0 = new Vector3(), p1 = new Vector3(), p2 = new Vector3())
    {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
    }

    /**
     * 三角形三个点
     */
    getPoints(): Vector3[]
    {
        return tri3GetPoints(this).map((p) => p as Vector3);
    }

    /**
     * 三边
     */
    getSegments(): Segment3[]
    {
        return tri3GetSegments(this).map((s) => new Segment3(toVector3(s.p0), toVector3(s.p1)));
    }

    /**
     * 三角形所在平面
     */
    // 跨类型：待 Plane 的 ops 落地后改为委托
    getPlane3d(pout = new Plane())
    {
        return pout.fromPoints(this.p0, this.p1, this.p2);
    }

    /**
     * 获取法线
     */
    getNormal(vout = new Vector3()): Vector3
    {
        tri3GetNormal(this, vout);

        return vout;
    }

    /**
     * 重心,三条中线相交的点叫做重心。
     */
    getBarycenter(pout = new Vector3()): Vector3
    {
        tri3GetBarycenter(this, pout);

        return pout;
    }

    /**
     * 外心，外切圆心,三角形三边的垂直平分线的交点，称为三角形外心。
     * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
     */
    getCircumcenter(pout = new Vector3()): Vector3
    {
        tri3GetCircumcenter(this, pout);

        return pout;
    }

    /**
     * 内心，内切圆心,三角形内心为三角形三条内角平分线的交点。
     * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
     */
    getInnercenter(pout = new Vector3()): Vector3
    {
        tri3GetInnercenter(this, pout);

        return pout;
    }

    /**
     * 垂心，三角形三边上的三条高或其延长线交于一点，称为三角形垂心。
     * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
     */
    getOrthocenter(pout = new Vector3()): Vector3
    {
        tri3GetOrthocenter(this, pout);

        return pout;
    }

    /**
     * 通过3顶点定义一个三角形
     * @param p0 点0
     * @param p1 点1
     * @param p2 点2
     */
    fromPoints(p0: Vector3, p1: Vector3, p2: Vector3): this
    {
        tri3FromPoints(p0, p1, p2, this);

        return this;
    }

    /**
     * 从顶点数据初始化三角形
     * @param positions 顶点数据
     */
    fromPositions(positions: number[]): this
    {
        tri3FromPositions(positions, this);

        return this;
    }

    /**
     * 获取三角形内的点
     * @param p 三点的权重（重心坐标系坐标）
     * @param pout 输出点
     */
    getPoint(p: Vector3, pout = new Vector3()): Vector3
    {
        tri3GetPoint(this, p, pout);

        return pout;
    }

    /**
     * 获取三角形内随机点
     * @param pout 输出点
     */
    randomPoint(pout = new Vector3()): Vector3
    {
        tri3RandomPoint(this, pout);

        return pout;
    }

    /**
     * 获取与直线相交，当直线与三角形不相交时返回null
     */
    // 跨类型：待 Plane / Segment3.intersectionWithLine 的 ops 落地后改为委托（本方法经 getPlane3d 传递依赖 Plane）
    intersectionWithLine(line: Line3)
    {
        const plane3d = this.getPlane3d();
        const cross = plane3d.intersectWithLine3(line);

        if (!cross)
        { return null; }
        if (cross instanceof Vector3)
        {
            if (this.onWithPoint(cross))
            { return cross; }

            return null;
        }

        // 直线分别于三边相交
        // 尚未找到相交线段，故允许为 null（后续使用前都会判空）
        let crossSegment: Segment3 | null = null;
        const ps = this.getSegments().reduce((v: Vector3[], segment) =>
        {
            const r = segment.intersectionWithLine(line);

            if (!r)
            { return v; }
            if (r instanceof Segment3)
            {
                crossSegment = r;

                return v;
            }
            v.push(r);

            return v;
        }, []);

        if (crossSegment)
        { return crossSegment; }
        if (ps.length === 0)
        { return null; }
        if (ps.length === 1)
        { return ps[0]; }
        if (ps[0].equals(ps[1]))
        {
            return ps[0];
        }

        return Segment3.fromPoints(ps[0], ps[1]);
    }

    /**
     * 获取与线段相交
     */
    // 跨类型：待 Plane / Segment3.intersectionWithLine 的 ops 落地后改为委托（本方法经 intersectionWithLine 传递依赖 Plane）
    intersectionWithSegment(segment: Segment3)
    {
        const r = this.intersectionWithLine(segment.getLine());

        if (!r) return null;
        if (r instanceof Vector3)
        {
            if (segment.onWithPoint(r))
            { return r; }

            return null;
        }
        const p0 = segment.clampPoint(r.p0);
        const p1 = segment.clampPoint(r.p1);

        if (!r.onWithPoint(p0))
        { return null; }
        if (p0.equals(p1))
        { return p0; }

        return Segment3.fromPoints(p0, p1);
    }

    /**
     * 判定点是否在三角形上
     * @param p 点
     * @param precision 精度，如果距离小于精度则判定为在三角形上
     */
    onWithPoint(p: Vector3, precision = mathUtil.PRECISION): boolean
    {
        return tri3OnWithPoint(this, p, precision);
    }

    /**
     * 求给出点的重心坐标系坐标
     *
     * @param p 点
     * @param bp 用于接收重心坐标系坐标
     *
     * @returns 重心坐标系坐标
     *
     * @see 3D数学基础：图形与游戏开发 P252 P249
     */
    getBarycentricCoordinates(p: Vector3, bp = new Vector3()): Vector3
    {
        tri3GetBarycentricCoordinates(this, p, bp);

        return bp;
    }

    /**
     * 获取指定点分别占三个点的混合值
     */
    blendWithPoint(p: Vector3): Vector3
    {
        return tri3BlendWithPoint(this, p) as Vector3;
    }

    /**
     * 与指定点最近的点
     * @param point 点
     * @param vout 输出点
     */
    // 跨类型：待 Plane 的 ops 落地后改为委托（本方法经 getPlane3d / getSegments 传递依赖 Plane）
    closestPointWithPoint(point: Vector3, vout = new Vector3())
    {
        this.getPlane3d().closestPointWithPoint(point, vout);
        if (this.onWithPoint(vout))
        { return vout; }
        const p = this.getSegments().map((s) =>
        {
            const p = s.closestPointWithPoint(point);

            return { point: p, d: point.distanceSquared(p) };
        }).sort((a, b) => a.d - b.d)[0].point;

        return vout.copy(p);
    }

    /**
     * 与点最近距离
     * @param point 点
     */
    // 跨类型：待 Plane 的 ops 落地后改为委托（本方法经 closestPointWithPoint 传递依赖 Plane）
    distanceWithPoint(point: Vector3)
    {
        return this.closestPointWithPoint(point).distance(point);
    }

    /**
     * 与点最近距离平方
     * @param point 点
     */
    // 跨类型：待 Plane 的 ops 落地后改为委托（本方法经 closestPointWithPoint 传递依赖 Plane）
    distanceSquaredWithPoint(point: Vector3)
    {
        return this.closestPointWithPoint(point).distanceSquared(point);
    }

    /**
     * 用点分解（切割）三角形
     */
    // 跨类型：待 Plane 的 ops 落地后改为委托（本方法经 onWithPoint / getSegments 传递依赖 Plane）
    decomposeWithPoint(p: Vector3)
    {
        if (!this.onWithPoint(p))
        { return [this]; }
        if (this.p0.equals(p) || this.p1.equals(p) || this.p2.equals(p))
        { return [this]; }
        if (Segment3.fromPoints(this.p0, this.p1).onWithPoint(p))
        { return [Triangle3.fromPoints(this.p0, p, this.p2), Triangle3.fromPoints(p, this.p1, this.p2)]; }
        if (Segment3.fromPoints(this.p1, this.p2).onWithPoint(p))
        { return [Triangle3.fromPoints(this.p1, p, this.p0), Triangle3.fromPoints(p, this.p2, this.p0)]; }
        if (Segment3.fromPoints(this.p2, this.p0).onWithPoint(p))
        { return [Triangle3.fromPoints(this.p2, p, this.p1), Triangle3.fromPoints(p, this.p0, this.p1)]; }

        return [Triangle3.fromPoints(p, this.p0, this.p1), Triangle3.fromPoints(p, this.p1, this.p2), Triangle3.fromPoints(p, this.p2, this.p0)];
    }

    /**
     * 用点分解（切割）三角形
     */
    // 跨类型：待 Plane 的 ops 落地后改为委托（本方法经 decomposeWithPoint 传递依赖 Plane）
    decomposeWithPoints(ps: Vector3[])
    {
        // 遍历顶点分割三角形
        const ts = ps.reduce((v: Triangle3[], p) =>
        {
            // 使用点分割所有三角形
            v = v.reduce((v0: Triangle3[], t) =>
                v0.concat(t.decomposeWithPoint(p)), []);

            return v;
        }, [this]);

        return ts;
    }

    /**
     * 用线段分解（切割）三角形
     * @param segment 线段
     */
    // 跨类型：待 Plane / Segment3 的 ops 落地后改为委托（本方法经 intersectionWithSegment 传递依赖 Plane）
    decomposeWithSegment(segment: Segment3)
    {
        const r = this.intersectionWithSegment(segment);

        if (!r) return [this];
        if (r instanceof Vector3)
        {
            return this.decomposeWithPoint(r);
        }
        const ts = this.decomposeWithPoints([r.p0, r.p1]);

        return ts;
    }

    /**
     * 用直线分解（切割）三角形
     * @param line 直线
     */
    // 跨类型：待 Plane 的 ops 落地后改为委托（本方法经 intersectionWithLine 传递依赖 Plane）
    decomposeWithLine(line: Line3)
    {
        const r = this.intersectionWithLine(line);

        if (!r) return [this];
        if (r instanceof Vector3)
        {
            return this.decomposeWithPoint(r);
        }
        const ts = this.decomposeWithPoints([r.p0, r.p1]);

        return ts;
    }

    /**
     * 面积
     */
    area(): number
    {
        return tri3Area(this);
    }

    /**
     * 栅格化，点阵化为XYZ轴间距为1的点阵
     */
    rasterize(): number[]
    {
        return tri3Rasterize(this);
    }

    /**
     * 平移
     * @param v 向量
     */
    translateVector3(v: Vector3): this
    {
        tri3Translate(this, v, this);

        return this;
    }

    /**
     * 缩放
     * @param v 缩放量
     */
    scaleVector3(v: Vector3): this
    {
        tri3ScaleVector3(this, v, this);

        return this;
    }

    /**
     * 自定义栅格化为点阵
     * @param voxelSize 体素尺寸，点阵XYZ轴间距
     * @param origin 原点，点阵中的某点正处于原点上，因此可以用作体素范围内的偏移
     */
    rasterizeCustom(voxelSize = new Vector3(1, 1, 1), origin = new Vector3()): { xi: number, yi: number, zi: number, xv: number, yv: number, zv: number }[]
    {
        return tri3RasterizeCustom(this, voxelSize, origin);
    }

    /**
     * 复制
     * @param triangle 三角形
     */
    copy(triangle: Triangle3): this
    {
        tri3Copy(triangle, this);

        return this;
    }

    /**
     * 克隆
     */
    clone(): Triangle3
    {
        return new Triangle3().copy(this);
    }

    /**
     * 判断指定点是否在三角形内
     *
     * @param p0 三角形0号点
     * @param p1 三角形1号点
     * @param p2 三角形2号点
     * @param p 指定点
     */
    // 跨类型：待 Plane 的 ops 落地后改为委托（经 onWithPoint 传递依赖 Plane）
    static containsPoint(p0: Vector3, p1: Vector3, p2: Vector3, p: Vector3)
    {
        return new Triangle3(p0, p1, p2).onWithPoint(p);
    }
}
