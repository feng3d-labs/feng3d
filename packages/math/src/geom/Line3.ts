import { mathUtil } from '@feng3d/polyfill';
import { Matrix4x4 } from './Matrix4x4';
import { Vector3 } from './Vector3';
import {
    line3ClosestPointParameterWithPoint,
    line3ClosestPointWithPoint,
    line3Copy,
    line3DistanceWithPoint,
    line3Equals,
    line3FromPoints,
    line3FromPosAndDir,
    line3GetPoint,
    line3GetPointWithZ,
    line3OnWithPoint,
    line3Random,
} from './line3Ops';

export interface Line3 extends MixinsLine3 { }

/**
 * 3d直线
 */
export class Line3
{
    /**
     * 根据直线上两点初始化直线
     * @param p0 Vector3
     * @param p1 Vector3
     */
    static fromPoints(p0: Vector3, p1: Vector3)
    {
        return new Line3().fromPoints(p0, p1);
    }

    /**
     * 根据直线某点与方向初始化直线
     * @param position 直线上某点
     * @param direction 直线的方向
     */
    static fromPosAndDir(position: Vector3, direction: Vector3)
    {
        return new Line3().fromPosAndDir(position, direction);
    }

    /**
     * 随机直线，比如用于单元测试
     */
    static random()
    {
        return new Line3(Vector3.random(), Vector3.random());
    }

    /**
     * 将当前直线 origin/direction 初始化为随机值（修改 this 并返回）
     */
    random()
    {
        line3Random(this);

        return this;
    }

    /**
     * 直线上某一点
     */
    origin: Vector3;

    /**
     * 直线方向(已标准化)
     */
    direction: Vector3;

    /**
     * 根据直线某点与方向创建直线
     * @param origin 直线上某点
     * @param direction 直线的方向
     */
    constructor(origin?: Vector3, direction?: Vector3)
    {
        this.origin = origin ? origin : new Vector3();
        this.direction = (direction ? direction : new Vector3(0, 0, 1)).normalize();
    }

    /**
     * 根据直线上两点初始化直线
     * @param p0 Vector3
     * @param p1 Vector3
     */
    fromPoints(p0: Vector3, p1: Vector3)
    {
        line3FromPoints(p0, p1, this);

        return this;
    }

    /**
     * 根据直线某点与方向初始化直线
     * @param position 直线上某点
     * @param direction 直线的方向
     */
    fromPosAndDir(position: Vector3, direction: Vector3)
    {
        line3FromPosAndDir(position, direction, this);

        return this;
    }

    /**
     * 获取直线上的一个点
     * @param length 与原点距离
     */
    getPoint(length = 0, vout = new Vector3())
    {
        line3GetPoint(this, length, vout);

        return vout;
    }

    /**
     * 获取指定z值的点
     * @param z z值
     * @param vout 目标点（输出）
     * @returns 目标点
     */
    getPointWithZ(z: number, vout = new Vector3())
    {
        return line3GetPointWithZ(this, z, vout);
    }

    /**
     * 指定点到该直线距离
     * @param point 指定点
     */
    distanceWithPoint(point: Vector3)
    {
        return line3DistanceWithPoint(this, point);
    }

    /**
     * 与指定点最近点的系数
     * @param point 点
     */
    closestPointParameterWithPoint(point: Vector3)
    {
        return line3ClosestPointParameterWithPoint(this, point);
    }

    /**
     * 与指定点最近的点
     * @param point 点
     * @param vout 输出点
     */
    closestPointWithPoint(point: Vector3, vout = new Vector3())
    {
        line3ClosestPointWithPoint(this, point, vout);

        return vout;
    }

    /**
     * 判定点是否在直线上
     * @param point 点
     * @param precision 精度
     */
    onWithPoint(point: Vector3, precision = mathUtil.PRECISION)
    {
        return line3OnWithPoint(this, point, precision);
    }

    /**
     * 与直线相交
     * @param line3D 直线
     */
    // 跨类型（依赖 Plane / Matrix4x4 的纯函数层，尚未就绪）：暂留原实现，待其 ops 落地后改为委托
    intersectWithLine3D(line3D: Line3)
    {
        // 处理相等
        if (this.equals(line3D))
        { return this.clone(); }
        // 处理平行
        if (this.direction.isParallel(line3D.direction))
        { return null; }

        const plane = this.getPlane();
        const point = plane.intersectWithLine3(line3D) as Vector3;

        if (this.onWithPoint(point))
        { return point; }

        return null;
    }

    /**
     * 应用矩阵
     * @param mat 矩阵
     */
    // 跨类型（依赖 Plane / Matrix4x4 的纯函数层，尚未就绪）：暂留原实现，待其 ops 落地后改为委托
    applyMatri4x4(mat: Matrix4x4)
    {
        mat.transformPoint3(this.origin, this.origin);
        mat.transformVector3(this.direction, this.direction);

        return this;
    }

    /**
     * 与指定向量比较是否相等
     * @param v 比较的向量
     * @param precision 允许误差
     * @returns 相等返回true，否则false
     */
    equals(line: Line3, precision = mathUtil.PRECISION)
    {
        return line3Equals(this, line, precision);
    }

    /**
     * 拷贝
     * @param line 直线
     */
    copy(line: Line3)
    {
        line3Copy(line, this);

        return this;
    }

    /**
     * 克隆
     */
    clone()
    {
        const result = new Line3();

        line3Copy(this, result);

        return result;
    }
}
