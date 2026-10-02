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
import { mat4TransformPoint3, mat4TransformVector3 } from './matrix4x4Ops';

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
        // 走构造函数而不是 new Line3().fromPoints(...)：后者经实例方法委托到 line3FromPoints，
        // 会把分量复制进缺省占位对象、丢掉 origin 的对象身份；而构造函数是 this.origin = origin
        // 的引用赋值。Segment3 / Triangle3 的静态工厂都是这个模式（方案 §10.1 的 P8f）。
        return new Line3(p0, p1.subTo(p0));
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
        // 必须写回 vout 再返回：直接 return ops 结果会把返回类型退化成 WritableVector3Like，
        // 破坏「公共签名不变」的纪律（feng3d 的相机 #unprojectRay 就是这么被编译不过的）
        line3GetPointWithZ(this, z, vout);

        return vout;
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
     *
     * 留在 class 内（阶段 C 收口）：返回值是 `Line3 | Vector3 | null` 的**联合类型**，
     * 靠 `instanceof Vector3` / `this.equals` 判别「重合 / 平行 / 交于一点」，
     * 纯函数化要求显式判别字段（方案 §7 阶段 C 的 `__type__`）。
     * 其中纯计算部分（`getPlane()` / `Plane.intersectWithLine3` / `onWithPoint`）已分别委托给
     * `plane*` / `line3*` 纯函数层（方案 §5.5）。
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
     *
     * A3：跨类型委托给 `mat4TransformPoint3` / `mat4TransformVector3`。
     * 它的纯函数形式就是这两次变换的组合（原点按**点**变换、方向按**向量**变换），
     * 所以不再单独抽一个只做转发的 `line3ApplyMatrix4x4`；
     * `out` 传 `this.origin` / `this.direction`，就地语义与顺序（先点后向量）与改造前逐字一致。
     */
    applyMatri4x4(mat: Matrix4x4): this
    {
        mat4TransformPoint3(mat, this.origin, this.origin);
        mat4TransformVector3(mat, this.direction, this.direction);

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
