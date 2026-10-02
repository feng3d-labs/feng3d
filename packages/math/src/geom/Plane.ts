import { mathUtil } from '@feng3d/polyfill';
import { PlaneClassification } from '../enums/PlaneClassification';
import type { Line3, Line3Like } from './line3Ops';
import { line3Copy } from './line3Ops';
import {
    planeClassifyPoint,
    planeClosestPointWithPoint,
    planeCopy,
    planeDistanceWithPoint,
    planeEquals,
    planeFromNormalAndPoint,
    planeFromPoints,
    planeGetNormal,
    planeGetOrigin,
    planeIntersectWithLine3,
    planeIntersectWithPlane3D,
    planeIntersectWithTwoPlane3D,
    planeNegate,
    planeNormalize,
    planeOnWithPoint,
    planeParallelWithLine3D,
    planeParallelWithPlane3D,
    planeProjectPoint,
    planeRandom,
    planeRandomPoint,
    planeSet,
    planeToString,
} from './planeOps';
import { Vector3 } from './Vector3';
import { vec3From } from './vector3Ops';

/**
 * 平面
 *
 * ax+by+cz+d=0
 */
export class Plane
{
    /**
     * 通过3顶点定义一个平面
     * @param p0 点0
     * @param p1 点1
     * @param p2 点2
     */
    static fromPoints(p0: Vector3, p1: Vector3, p2: Vector3): Plane
    {
        return new Plane().fromPoints(p0, p1, p2);
    }

    /**
     * 根据法线与点定义平面
     * @param normal 平面法线
     * @param point 平面上任意一点
     */
    static fromNormalAndPoint(normal: Vector3, point: Vector3): Plane
    {
        return new Plane().fromNormalAndPoint(normal, point);
    }

    /**
     * 随机平面
     */
    static random(): Plane
    {
        return new Plane().random();
    }

    /**
     * 将当前平面初始化为随机平面（修改 this 并返回）
     */
    random(): this
    {
        planeRandom(this);

        return this;
    }

    /**
     * 平面A系数
     * <p>同样也是面法线x尺寸</p>
     */
    a: number;

    /**
     * 平面B系数
     * <p>同样也是面法线y尺寸</p>
     */
    b: number;

    /**
     * 平面C系数
     * <p>同样也是面法线z尺寸</p>
     */
    c: number;

    /**
     * 平面D系数
     * <p>同样也是原点到平面的距离</p>
     */
    d: number;

    /**
     * 创建一个平面
     * @param a A系数
     * @param b B系数
     * @param c C系数
     * @param d D系数
     */
    constructor(a = 0, b = 1, c = 0, d = 0)
    {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    /**
     * 设置
     *
     * @param a A系数
     * @param b B系数
     * @param c C系数
     * @param d D系数
     */
    set(a: number, b: number, c: number, d: number): this
    {
        planeSet(a, b, c, d, this);

        return this;
    }

    /**
     * 原点在平面上的投影
     * @param vout 输出点
     */
    getOrigin(vout = new Vector3()): Vector3
    {
        planeGetOrigin(this, vout);

        return vout;
    }

    /**
     * 平面上随机点
     * @param vout 输出点
     */
    randomPoint(vout = new Vector3()): Vector3
    {
        planeRandomPoint(this, vout);

        return vout;
    }

    /**
     * 法线
     */
    getNormal(vout = new Vector3()): Vector3
    {
        planeGetNormal(this, vout);

        return vout;
    }

    /**
     * 通过3顶点定义一个平面
     * @param p0 点0
     * @param p1 点1
     * @param p2 点2
     */
    fromPoints(p0: Vector3, p1: Vector3, p2: Vector3): this
    {
        planeFromPoints(p0, p1, p2, this);

        return this;
    }

    /**
     * 根据法线与点定义平面
     * @param normal 平面法线
     * @param point 平面上任意一点
     */
    fromNormalAndPoint(normal: Vector3, point: Vector3): this
    {
        planeFromNormalAndPoint(normal, point, this);

        return this;
    }

    /**
     * 计算点与平面的距离
     * @param p 点
     * @returns        距离
     */
    distanceWithPoint(p: Vector3): number
    {
        return planeDistanceWithPoint(this, p);
    }

    /**
     * 点是否在平面上
     * @param p 点
     */
    onWithPoint(p: Vector3, precision = mathUtil.PRECISION): boolean
    {
        return planeOnWithPoint(this, p, precision);
    }

    /**
     * 顶点分类
     * <p>把顶点分为后面、前面、相交三类</p>
     * @param p 顶点
     * @returns         顶点类型 PlaneClassification.BACK,PlaneClassification.FRONT,PlaneClassification.INTERSECT
     */
    classifyPoint(p: Vector3, precision = mathUtil.PRECISION): PlaneClassification
    {
        return planeClassifyPoint(this, p, precision);
    }

    /**
     * 判定与直线是否平行
     *
     * **阶段 C-d 起形参放宽为最小形状 `Line3Like`**（`Line3` 的 class 已删除，
     * `line3FromPoints(...)` 这类纯函数只产不带判别字段的字面量）。
     * @param line3D
     */
    parallelWithLine3D(line3D: Line3Like, precision = mathUtil.PRECISION): boolean
    {
        return planeParallelWithLine3D(this, line3D, precision);
    }

    /**
     * 判定与平面是否平行
     * @param plane3D
     */
    parallelWithPlane3D(plane3D: Plane, precision = mathUtil.PRECISION): boolean
    {
        return planeParallelWithPlane3D(this, plane3D, precision);
    }

    /**
     * 获取与直线交点
     *
     * **阶段 C-d 起形参放宽为最小形状 `Line3Like`**；返回类型仍是 `Line3 | Vector3 | null`
     * （`Line3` 现在是带 `__type__: 'Line3'` 的纯数据接口，判别字段由装配点显式补上，不退化）。
     *
     * @see 3D数学基础：图形与游戏开发 P269
     */
    intersectWithLine3(line: Line3Like): Line3 | Vector3 | null
    {
        const result = planeIntersectWithLine3(this, line);

        if (result === null)
        { return null; }
        if ('origin' in result)
        {
            const line3 = line3Copy(result);

            return { __type__: 'Line3', origin: line3.origin, direction: line3.direction };
        }
        const point = new Vector3();

        vec3From(result.x, result.y, result.z, point);

        return point;
    }

    /**
     * 获取与平面相交直线
     *
     * **阶段 C-d**：原先的 `new Line3()` 占位对象改为纯数据字面量（`planeIntersectWithPlane3D`
     * 只管写 `origin` / `direction`），判别字段 `__type__: 'Line3'` 由本方法显式补上。
     * @param plane3D
     */
    intersectWithPlane3D(plane3D: Plane): Line3 | null
    {
        const result = planeIntersectWithPlane3D(this, plane3D);

        if (result === null)
        { return null; }

        return { __type__: 'Line3', origin: result.origin, direction: result.direction };
    }

    /**
     * 标准化
     */
    normalize(): this
    {
        planeNormalize(this, this);

        return this;
    }

    /**
     * 翻转平面
     */
    negate(): this
    {
        planeNegate(this, this);

        return this;
    }

    /**
     * 点到平面的投影
     * @param point
     */
    projectPoint(point: Vector3, vout = new Vector3()): Vector3
    {
        planeProjectPoint(this, point, vout);

        return vout;
    }

    /**
     * 与指定点最近的点
     * @param point 点
     * @param vout 输出点
     */
    closestPointWithPoint(point: Vector3, vout = new Vector3()): Vector3
    {
        planeClosestPointWithPoint(this, point, vout);

        return vout;
    }

    /**
     * 与其他两平面相交于一点
     *
     * @param plane0
     * @param plane1
     *
     * @see 3D数学基础：图形与游戏开发 P271
     */
    intersectWithTwoPlane3D(plane0: Plane, plane1: Plane): Vector3 | null
    {
        const result = new Vector3();

        if (planeIntersectWithTwoPlane3D(this, plane0, plane1, result) === null)
        { return null; }

        return result;
    }

    /**
     * 与指定平面是否相等
     *
     * @param plane
     * @param precision
     */
    equals(plane: Plane, precision = mathUtil.PRECISION): boolean
    {
        return planeEquals(this, plane, precision);
    }

    /**
     * 复制
     */
    copy(plane: Plane): this
    {
        planeCopy(plane, this);

        return this;
    }

    /**
     * 克隆
     */
    clone(): Plane
    {
        const result = new Plane();

        planeCopy(this, result);

        return result;
    }

    /**
     * 输出字符串
     */
    toString(): string
    {
        return planeToString(this);
    }
}
// var v0 = new Vector3();
// var v1 = new Vector3();
// var v2 = new Vector3();

// 阶段 C-d：原先挂在这里的 `Line3.prototype.getPlane`（`declare global` 的 `MixinsLine3` 补丁）
// 已随 `Line3` 的 class 一起删除，纯函数形态落在 `planeOps.ts` 的 `planeFromLine3`。
// 那句「过一条直线的平面」在 `Line3.getPlane` 与 `Line3.intersectWithLine3D` 里是同一份计算，
// 合并后 `Math.random()` 的消费次数与顺序逐字不变。
