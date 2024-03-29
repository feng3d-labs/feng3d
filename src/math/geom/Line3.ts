import { mathUtil } from '../../polyfill/MathUtil';
import { Matrix4x4 } from './Matrix4x4';
import { Vector3 } from './Vector3';

/**
 * 3d直线
 */
export class Line3
{
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
     * 随机直线，比如用于单元测试
     */
    random()
    {
        return new Line3(new Vector3().random(), new Vector3().random());
    }

    /**
     * 根据直线上两点初始化直线
     * @param p0 Vector3
     * @param p1 Vector3
     */
    fromPoints(p0: Vector3, p1: Vector3)
    {
        this.origin = p0;
        this.direction = p1.subTo(p0).normalize();

        return this;
    }

    /**
     * 根据直线某点与方向初始化直线
     * @param position 直线上某点
     * @param direction 直线的方向
     */
    fromPosAndDir(position: Vector3, direction: Vector3)
    {
        this.origin = position;
        this.direction = direction.normalize();

        return this;
    }

    /**
     * 获取直线上的一个点
     * @param length 与原点距离
     */
    getPoint(length = 0, vOut = new Vector3())
    {
        return vOut.copy(this.direction).scaleNumber(length).add(this.origin);
    }

    /**
     * 获取指定z值的点
     * @param z z值
     * @param vOut 目标点（输出）
     * @returns 目标点
     */
    getPointWithZ(z: number, vOut = new Vector3())
    {
        return this.getPoint((z - this.origin.z) / this.direction.z, vOut);
    }

    /**
     * 指定点到该直线距离
     * @param point 指定点
     */
    distanceWithPoint(point: Vector3)
    {
        return this.closestPointWithPoint(point).sub(point).length;
    }

    /**
     * 与指定点最近点的系数
     * @param point 点
     */
    closestPointParameterWithPoint(point: Vector3)
    {
        return point.subTo(this.origin).dot(this.direction);
    }

    /**
     * 与指定点最近的点
     * @param point 点
     * @param vOut 输出点
     */
    closestPointWithPoint(point: Vector3, vOut = new Vector3())
    {
        const t = this.closestPointParameterWithPoint(point);

        return this.getPoint(t, vOut);
    }

    /**
     * 判定点是否在直线上
     * @param point 点
     * @param precision 精度
     */
    onWithPoint(point: Vector3, precision = mathUtil.PRECISION)
    {
        if (mathUtil.equals(this.distanceWithPoint(point), 0, precision))
        { return true; }

        return false;
    }

    /**
     * 与直线相交
     * @param line3D 直线
     */
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
    applyMatrix4x4(mat: Matrix4x4)
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
        if (!this.onWithPoint(line.origin, precision))
        {
            return false;
        }
        if (!this.onWithPoint(line.origin.addTo(line.direction), precision))
        {
            return false;
        }

        return true;
    }

    /**
     * 拷贝
     * @param line 直线
     */
    copy(line: Line3)
    {
        this.origin.copy(line.origin);
        this.direction.copy(line.direction);

        return this;
    }

    /**
     * 克隆
     */
    clone()
    {
        return new Line3().copy(this);
    }
}
