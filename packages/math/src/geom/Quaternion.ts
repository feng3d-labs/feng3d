import { mathUtil } from '@feng3d/polyfill';
import { RotationOrder } from '../enums/RotationOrder';
import type { Matrix4x4 } from './Matrix4x4';
import { Vector3, Vector3Like } from './Vector3';
import {
    quatCopy,
    quatEquals,
    quatFromArray,
    quatFromAxisAngle,
    quatFromEuler,
    quatFromMatrix,
    quatFromUnitVectors,
    quatIntegrate,
    quatInverse,
    quatLerp,
    quatMagnitude,
    quatMult,
    quatMultiplyVector,
    quatNormalize,
    quatNormalizeFast,
    quatRotatePoint,
    quatSet,
    quatSlerp,
    quatToArray,
    quatToAxisAngle,
    quatToString,
    quatVmult,
} from './quaternionOps';

declare global
{
    interface MixinsQuaternion
    {

    }
}

export interface Quaternion extends MixinsQuaternion { }

/**
 * 可用于表示旋转的四元数对象
 */
export class Quaternion
{
    static fromArray(array: ArrayLike<number>, offset = 0)
    {
        return new Quaternion().fromArray(array, offset);
    }

    /**
     * 随机四元数
     */
    static random()
    {
        return new Quaternion().fromEuler(Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());
    }

    /**
     * 将当前四元数初始化为随机旋转（修改 this 并返回）
     */
    random()
    {
        return this.fromEuler(Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());
    }

    /**
     * 虚基向量i的乘子
     */
    x = 0;

    /**
     * 虚基向量j的乘子
     */
    y = 0;

    /**
     * 虚基向量k的乘子
     */
    z = 0;

    /**
     * 实部的乘数
     */
    w = 1;

    /**
     * 四元数描述三维空间中的旋转。四元数的数学定义为Q = x*i + y*j + z*k + w，其中(i,j,k)为虚基向量。(x,y,z)可以看作是一个与旋转轴相关的向量，而实际的乘法器w与旋转量相关。
     *
     * @param x 虚基向量i的乘子
     * @param y 虚基向量j的乘子
     * @param z 虚基向量k的乘子
     * @param w 实部的乘数
     */
    constructor(x = 0, y = 0, z = 0, w = 1)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * 返回四元数对象的大小
     */
    get magnitude(): number
    {
        return quatMagnitude(this);
    }

    /**
     * 设置四元数的值。
     *
     * @param x 虚基向量i的乘子
     * @param y 虚基向量j的乘子
     * @param z 虚基向量k的乘子
     * @param w 实部的乘数
     */
    set(x = 0, y = 0, z = 0, w = 1)
    {
        quatSet(x, y, z, w, this);

        return this;
    }

    fromArray(array: ArrayLike<number>, offset = 0)
    {
        quatFromArray(array, offset, this);

        return this;
    }

    /**
     * 转换为数组
     *
     * @param array
     * @param offset
     */
    toArray(array?: number[], offset = 0)
    {
        return quatToArray(this, array, offset);
    }

    /**
     * 四元数乘法
     *
     * @param q
     * @param this
     */
    mult(q: Quaternion)
    {
        quatMult(this, q, this);

        return this;
    }

    /**
     * 四元数乘法
     *
     * @param q
     * @param target
     */
    multTo(q: Quaternion, target = new Quaternion())
    {
        quatMult(this, q, target);

        return target;
    }

    /**
     * 获取逆四元数（共轭四元数）
     */
    inverse()
    {
        quatInverse(this, this);

        return this;
    }

    /**
     * 获取逆四元数（共轭四元数）
     *
     * @param target
     */
    inverseTo(target = new Quaternion())
    {
        quatInverse(this, target);

        return target;
    }

    /**
     * 四元数乘一个向量（结果写进 `target`）。
     *
     * `vector` 已放宽为 {@link Vector3Like}（issue #134）：纯数据 `{ x, y, z }` 也算；
     * `target` 是 out 形态**不放宽**——它的类型即返回类型，放宽会让返回退化为 `WritableQuaternionLike`（P8c）。
     *
     * @param vector 被乘的向量
     * @param target 结果目标
     */
    multiplyVector(vector: Vector3Like, target = new Quaternion())
    {
        quatMultiplyVector(this, vector, target);

        return target;
    }

    /**
     * 用表示给定绕向量旋转的值填充四元数对象。
     *
     * `axis` 已放宽为 {@link Vector3Like}（issue #134）：纯数据 `{ x, y, z }` 也算。
     *
     * @param axis 要绕其旋转的轴
     * @param angle 以弧度为单位的旋转角度。
     */
    fromAxisAngle(axis: Vector3Like, angle: number)
    {
        quatFromAxisAngle(axis, angle, this);

        return this;
    }

    /**
     * 将四元数转换为轴/角表示形式
     *
     * @param targetAxis 要重用的向量对象，用于存储轴
     * @returns 一个数组，第一个元素是轴，第二个元素是弧度
     */
    toAxisAngle(targetAxis = new Vector3())
    {
        // 原有副作用：先归一化 this（逐字保留，见方案 §10.1 的「行为逐字不变」）
        this.normalize();

        return quatToAxisAngle(this, targetAxis);
    }

    /**
     * 给定两个单位向量，设置四元数值。得到的旋转将是将u旋转到v所需要的旋转。
     *
     * `u` / `v` 已放宽为 {@link Vector3Like}（issue #134）：纯数据 `{ x, y, z }` 也算。
     *
     * @param u 表示起始方向的单位向量。
     * @param v 表示终止方向的单位向量。
     */
    fromUnitVectors(u: Vector3Like, v: Vector3Like)
    {
        quatFromUnitVectors(u, v, this);

        return this;
    }

    /**
     * 与目标四元数之间进行球面内插，提供了具有恒定角度变化率的旋转之间的内插。
     * @param qb 目标四元素
     * @param t 插值权值，一个介于0和1之间的值。
     */
    slerp(qb: Quaternion, t: number)
    {
        quatSlerp(this, qb, t, this);

        return this;
    }

    /**
     * 与目标四元数之间进行球面内插，提供了具有恒定角度变化率的旋转之间的内插。
     * @param qb 目标四元素
     * @param t 插值权值，一个介于0和1之间的值。
     * @param out 保存插值结果
     */
    slerpTo(qb: Quaternion, t: number, out = new Quaternion())
    {
        if (qb === out) qb = qb.clone();

        quatSlerp(this, qb, t, out);

        return out;
    }

    /**
     * 线性求插值
     * @param qa 第一个四元素
     * @param qb 第二个四元素
     * @param t 权重
     */
    lerp(qa: Quaternion, qb: Quaternion, t: number)
    {
        quatLerp(qa, qb, t, this);
    }

    /**
     * 四元数归一化
     */
    normalize(val = 1)
    {
        quatNormalize(this, val, this);

        return this;
    }

    /**
     * 四元数归一化的近似。当quat已经几乎标准化时，效果最好。
     *
     * @see http://jsperf.com/fast-quaternion-normalization
     * @author unphased, https://github.com/unphased
     */
    normalizeFast()
    {
        quatNormalizeFast(this, this);

        return this;
    }

    /**
     * 转换为可读格式
     */
    toString()
    {
        return quatToString(this);
    }

    /**
     * 从矩阵初始化四元素
     *
     * @param matrix 矩阵
     */
    fromMatrix(matrix: Matrix4x4)
    {
        quatFromMatrix(matrix, this);

        return this;
    }

    /**
     * 克隆
     */
    clone()
    {
        const result = new Quaternion();

        quatCopy(this, result);

        return result;
    }

    /**
     * 旋转一个顶点
     *
     * `point` 已放宽为 {@link Vector3Like}（issue #134）：纯数据 `{ x, y, z }` 也算；
     * `target` 是 out 形态**不放宽**——它的类型即返回类型，放宽会让返回退化为 `WritableVector3Like`（P8c）。
     *
     * @param point 被旋转的顶点
     * @param target 旋转结果
     */
    rotatePoint(point: Vector3Like, target = new Vector3())
    {
        quatRotatePoint(this, point, target);

        return target;
    }

    /**
     * 旋转一个绝对方向四元数给定一个角速度和一个时间步长
     *
     * `angularVelocity` / `angularFactor` 已放宽为 {@link Vector3Like}（issue #134）：纯数据 `{ x, y, z }` 也算。
     *
     * @param angularVelocity 角速度
     * @param dt 时间步长
     * @param angularFactor 角速度分量开关
     */
    integrate(angularVelocity: Vector3Like, dt: number, angularFactor: Vector3Like)
    {
        quatIntegrate(this, angularVelocity, dt, angularFactor, this);

        return this;
    }

    /**
     * 旋转一个绝对方向四元数给定一个角速度和一个时间步长
     *
     * `angularVelocity` / `angularFactor` 已放宽为 {@link Vector3Like}（issue #134）：纯数据 `{ x, y, z }` 也算；
     * `target` 是 out 形态**不放宽**——它的类型即返回类型，放宽会让返回退化为 `WritableQuaternionLike`（P8c）。
     *
     * @param angularVelocity 角速度
     * @param dt 时间步长
     * @param angularFactor 角速度分量开关
     * @param target 结果目标
     */
    integrateTo(angularVelocity: Vector3Like, dt: number, angularFactor: Vector3Like, target = new Quaternion())
    {
        quatIntegrate(this, angularVelocity, dt, angularFactor, target);

        return target;
    }

    /**
     * 将源的值复制到此四元数
     *
     * @param q 要复制的四元数
     */
    copy(q: Quaternion)
    {
        quatCopy(q, this);

        return this;
    }

    /**
     * Multiply the quaternion by a vector
     *
     * `v` 已放宽为 {@link Vector3Like}（issue #134）：纯数据 `{ x, y, z }` 也算；
     * `target` 是 out 形态**不放宽**——它的类型即返回类型，放宽会让返回退化为 `WritableVector3Like`（P8c）。
     *
     * @param v 被乘的向量
     * @param target Optional 结果目标
     */
    vmult(v: Vector3Like, target = new Vector3())
    {
        quatVmult(this, v, target);

        return target;
    }

    /**
     * 从欧拉角初始化四元素。
     *
     * @param x 围绕X轴旋转角度（弧度）。
     * @param y 围绕Y轴旋转角度（弧度）。
     * @param z 围绕Z轴旋转角度（弧度）。
     * @param order X、Y、Z轴旋顺序。
     *
     * @see http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m
     */
    fromEuler(x: number, y: number, z: number, order: RotationOrder = mathUtil.DefaultRotationOrder)
    {
        quatFromEuler(x, y, z, order, this);

        return this;
    }

    /**
     * 与指定四元素比较是否相等。
     *
     * @param v 比较的向量。
     * @param precision 允许误差。
     * @returns 相等返回true，否则false。
     */
    equals(v: Quaternion, precision = mathUtil.PRECISION)
    {
        return quatEquals(this, v, precision);
    }
}
