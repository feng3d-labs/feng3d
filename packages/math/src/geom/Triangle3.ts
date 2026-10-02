import { mathUtil } from '@feng3d/polyfill';
import { tri3IntersectionWithLine } from './intersectionOps';
import { Line3 } from './Line3';
import { Plane } from './Plane';
import { planeFromPoints } from './planeOps';
import { Segment3 } from './Segment3';
import {
    tri3Area,
    tri3BlendWithPoint,
    tri3ClosestPointWithPoint,
    tri3Copy,
    tri3DistanceSquaredWithPoint,
    tri3DistanceWithPoint,
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
 *
 * A3 收口后仍留在 class 内的成员只剩两组（见各方法上的注释）：
 *
 * 1. `intersectionWithLine` / `intersectionWithSegment`——返回值是 `Vector3 | Segment3 | null`
 *    联合类型，靠 `instanceof` 判别，要等阶段 C 的 `__type__` 判别字段；
 * 2. `decomposeWithPoint` 及其上层 `decomposeWithPoints` / `decomposeWithSegment` / `decomposeWithLine`
 *    ——它们要**构造 `Triangle3` 实例**，且原语义是「顶点就是原对象」（引用），
 *    装配回 class 时不能把纯字面量当顶点（会丢 `Vector3` 原型）。
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
     *
     * A3：跨类型委托给 `planeFromPoints`（先写 `pout` 再返回，返回类型不退化成 `WritablePlaneLike`）。
     */
    getPlane3d(pout = new Plane()): Plane
    {
        planeFromPoints(this.p0, this.p1, this.p2, pout);

        return pout;
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
     *
     * **阶段 C-a 起委托给纯函数 `tri3IntersectionWithLine`**（`./intersectionOps`）：
     * 判别字段（`'origin' in r` = 直线落在三角形平面上、`'p0' in r` = 交于一段）替代了原来的
     * `instanceof Vector3` / `instanceof Segment3`；纯计算部分仍在各自的 `*Ops.ts` 里。
     * 装配回 class 实例（`Segment3.fromPoints` / `new Vector3(...)`）保证**对外的原型语义逐字不变**
     * （`intersectionWithSegment` / `decomposeWith*` 仍靠 `instanceof` 分支，见本文件内其他方法）。
     */
    intersectionWithLine(line: Line3)
    {
        const r = tri3IntersectionWithLine(this, line);

        if (!r)
        { return null; }
        if ('p0' in r)
        { return new Segment3(toVector3(r.p0), toVector3(r.p1)); }

        return new Vector3(r.x, r.y, r.z);
    }

    /**
     * 获取与线段相交
     *
     * **留在 class 内（阶段 C 收口）**：与 `intersectionWithLine` 同理，
     * 返回值是 `Vector3 | Segment3 | null` 的 `instanceof` 判别分支。
     */
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
     *
     * A3：委托给 `tri3ClosestPointWithPoint`（先写 `vout` 再返回）。
     */
    closestPointWithPoint(point: Vector3, vout = new Vector3()): Vector3
    {
        tri3ClosestPointWithPoint(this, point, vout);

        return vout;
    }

    /**
     * 与点最近距离
     * @param point 点
     *
     * A3：委托给 `tri3DistanceWithPoint`。
     */
    distanceWithPoint(point: Vector3): number
    {
        return tri3DistanceWithPoint(this, point);
    }

    /**
     * 与点最近距离平方
     * @param point 点
     *
     * A3：委托给 `tri3DistanceSquaredWithPoint`。
     */
    distanceSquaredWithPoint(point: Vector3): number
    {
        return tri3DistanceSquaredWithPoint(this, point);
    }

    /**
     * 用点分解（切割）三角形
     *
     * **留在 class 内（阶段 C 收口）**：结果要 `new Triangle3(p0, p1, p2)` 装配，
     * 且原语义是**顶点引用赋值**（`Triangle3.fromPoints` 直接把入参对象当顶点，
     * 主仓 `Box3.spec.ts` 断言过 `triangle.p0 === p0`）。纯函数层产出的是普通字面量，
     * 拿它当顶点会丢 `Vector3` 原型（`p0.clone()` 之类调用会炸），故不强行纯函数化；
     * 方法内的判定（`onWithPoint` / 线段 `onWithPoint`）都已走纯函数层。
     */
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
     *
     * **留在 class 内（阶段 C 收口）**：遍历调用 `decomposeWithPoint`，本身只是循环，
     * 没有可独立出来的纯计算。
     */
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
     *
     * **留在 class 内（阶段 C 收口）**：经 `intersectionWithSegment` 拿到
     * `Vector3 | Segment3 | null` 后按 `instanceof` 分支。
     */
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
     *
     * **留在 class 内（阶段 C 收口）**：经 `intersectionWithLine` 拿到
     * `Vector3 | Segment3 | null` 后按 `instanceof` 分支。
     */
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
     *
     * A3：直接委托 `tri3OnWithPoint`，不再 `new Triangle3(...)`——纯计算不需要构造实例。
     */
    static containsPoint(p0: Vector3, p1: Vector3, p2: Vector3, p: Vector3): boolean
    {
        return tri3OnWithPoint({ p0, p1, p2 }, p);
    }
}
