import { mathUtil } from '@feng3d/polyfill';
import { Matrix4x4 } from './Matrix4x4';
import {
    mat3Copy,
    mat3Equals,
    mat3FromArray,
    mat3GetElement,
    mat3FromMatrix4x4,
    mat3GetScale,
    mat3GetTrace,
    mat3Identity,
    mat3Multiply,
    mat3Reverse,
    mat3Scale,
    mat3ScaleNumber,
    mat3Set,
    mat3SetElement,
    mat3SetRotationFromQuaternion,
    mat3SetTrace,
    mat3SetZero,
    mat3Solve,
    mat3ToArray,
    mat3ToMatrix4x4,
    mat3ToString,
    mat3Transpose,
    mat3Vmult,
} from './matrix3x3Ops';
import type { Matrix3x3Elements } from './matrix3x3Ops';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

/** 九个矩阵元素的元组（与 `matrix3x3Ops.ts` 的 `Matrix3x3Elements` 同源） */
type NmberArray9 = Matrix3x3Elements;

/**
 * Matrix3x3 类表示一个转换矩阵，该矩阵确定二维 (2D) 显示对象的位置和方向。
 * 该矩阵可以执行转换功能，包括平移（沿 x 和 y 轴重新定位）、旋转和缩放（调整大小）。
 * ```
 *  ---                                   ---
 *  |   scaleX      0         0    |   x轴
 *  |     0       scaleY      0    |   y轴
 *  |     tx        ty        1    |   平移
 *  ---                                   ---
 *
 *  ---                                   ---
 *  |     0         1         2    |   x轴
 *  |     3         4         5    |   y轴
 *  |     6         7         8    |   平移
 *  ---                                   ---
 * ```
 *
 * 各类运算的实现已抽到 `matrix3x3Ops.ts` 的**纯函数**层（issue #134 阶段 A2c），
 * 本类的同名方法只是委托（签名、返回值、就地语义都不变）。
 * 只剩 `formMatrix4x4` / `toMatrix4x4` 两个 **Matrix4x4 面向**的方法暂留原实现
 * （Matrix4x4 的 ops 还没落地），已在方法内标注。
 */
export class Matrix3x3
{
    /**
     * 长度为9的向量，包含所有的矩阵元素
     */
    elements: NmberArray9;

    /**
     * 构建3x3矩阵
     *
     * @param elements 九个元素的数组
     */
    constructor(elements: NmberArray9 = [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1])
    {
        this.elements = elements;
    }

    set(elements: NmberArray9)
    {
        // 与 class 原实现一致：直接持有传入数组（不拷贝九个数字）
        mat3Set(elements, this);
    }

    /**
     * 设置矩阵为单位矩阵
     */
    identity()
    {
        mat3Identity(this);

        return this;
    }

    /**
     * 将所有元素设置为0
     */
    setZero()
    {
        mat3SetZero(this);

        return this;
    }

    /**
     * 根据一个 Vector3 设置矩阵对角元素
     *
     * @param vec3
     */
    setTrace(vec3: Vector3)
    {
        mat3SetTrace(vec3, this);

        return this;
    }

    /**
     * 获取矩阵对角元素
     */
    getTrace(target = new Vector3())
    {
        mat3GetTrace(this, target);

        return target;
    }

    /**
     * 矩阵向量乘法
     *
     * @param v 要乘以的向量
     * @param target 目标保存结果
     */
    vmult(v: Vector3, target = new Vector3())
    {
        mat3Vmult(this, v, target);

        return target;
    }

    /**
     * 矩阵标量乘法
     * @param s
     */
    smult(s: number)
    {
        // 就地逐元素缩放；原方法没有返回值，这里保持 void
        mat3ScaleNumber(this, s, this);
    }

    /**
     * 矩阵乘法
     * @param m 要从左边乘的矩阵。
     */
    mmult(m: Matrix3x3, target = new Matrix3x3())
    {
        // 原实现算的是 this × m（m 在右，尽管上面的说明写反了），参数顺序不能颠倒
        mat3Multiply(this, m, target);

        return target;
    }

    /**
     * 缩放矩阵的每一列
     *
     * @param v
     */
    scale(v: Vector3, target = new Matrix3x3())
    {
        mat3Scale(this, v, target);

        return target;
    }

    /**
     * 解决Ax = b
     *
     * @param b 右手边
     * @param target 结果
     */
    solve(b: Vector3, target = new Vector3())
    {
        mat3Solve(this, b, target);

        return target;
    }

    /**
     * 获取指定行列元素值
     *
     * @param row
     * @param column
     */
    getElement(row: number, column: number)
    {
        return mat3GetElement(this, row, column);
    }

    /**
     * 设置指定行列元素值
     *
     * @param row
     * @param column
     * @param value
     */
    setElement(row: number, column: number, value: number)
    {
        mat3SetElement(this, row, column, value);
    }

    /**
     * 将另一个矩阵复制到这个矩阵对象中
     *
     * @param source
     */
    copy(source: Matrix3x3)
    {
        mat3Copy(source, this);

        return this;
    }

    /**
     * 返回矩阵的字符串表示形式
     */
    toString()
    {
        return mat3ToString(this);
    }

    /**
     * 逆矩阵
     */
    reverse()
    {
        mat3Reverse(this, this);

        return this;
    }

    /**
     * 逆矩阵
     */
    reverseTo(target = new Matrix3x3())
    {
        // 与原实现 `target.copy(this).reverse()` 逐字等价：先整体拷贝再就地求逆，
        // 这样求逆失败（抛错）时 target 里已写入的部分也与原实现一致。
        mat3Copy(this, target);
        mat3Reverse(target, target);

        return target;
    }

    /**
     * 从四元数设置矩阵
     *
     * @param q
     */
    setRotationFromQuaternion(q: Quaternion)
    {
        mat3SetRotationFromQuaternion(q, this);

        return this;
    }

    /**
     * 转置矩阵
     */
    transpose()
    {
        mat3Transpose(this, this);

        return this;
    }

    /**
     * 转置矩阵
     */
    transposeTo(target = new Matrix3x3())
    {
        mat3Transpose(this, target);

        return target;
    }

    formMatrix4x4(matrix4x4: Matrix4x4)
    {
        mat3FromMatrix4x4(matrix4x4, this);

        return this;
    }

    /**
     * 转换为4x4矩阵
     *
     * @param outMatrix4x4 4x4矩阵
     */
    toMatrix4x4(outMatrix4x4: Matrix4x4)
    {
        mat3ToMatrix4x4(this, outMatrix4x4);

        return outMatrix4x4;
    }

    /**
     * 转换为数组
     * @param array 数组
     * @param offset 偏移
     */
    toArray(array: number[] = [], offset = 0)
    {
        return mat3ToArray(this, array, offset);
    }

    // ---- 以下为向 Matrix4x4 对齐的 API（issue #127）----
    // 命名与语义都对应该类，便于两处矩阵代码互换；历史命名（`vmult` / `reverse` / `toArray`）
    // 一律保留，不做破坏性重命名。

    /**
     * 从数组填充本矩阵（与 {@link toArray} 配对，对应 `Matrix4x4.fromArray`）。
     *
     * @param array 源数组
     * @param index 起始下标
     */
    fromArray(array: number[], index = 0)
    {
        mat3FromArray(array, index, this);

        return this;
    }

    /**
     * 克隆一份（对应 `Matrix4x4.clone`）。
     */
    clone()
    {
        // 结果必须是 Matrix3x3 实例（纯函数缺省 out 是普通字面量），所以先建实例再委托 copy
        return new Matrix3x3().copy(this);
    }

    /**
     * 逐元素相等判定（对应 `Matrix4x4.equals`）。
     *
     * @param matrix 待比较矩阵
     * @param precision 精度（默认 `mathUtil.PRECISION`）
     */
    equals(matrix: Matrix3x3, precision = mathUtil.PRECISION)
    {
        return mat3Equals(this, matrix, precision);
    }

    /**
     * 求逆矩阵（原地，对应 `Matrix4x4.invert`）。
     *
     * 与 {@link reverse} 等价——后者是历史命名，保留以兼容既有调用。
     */
    invert()
    {
        this.reverse();

        return this;
    }

    /**
     * 矩阵与向量相乘（对应 `Matrix4x4.transformVector3`）。
     *
     * 与 {@link vmult} 等价——后者是历史命名，保留以兼容既有调用。
     *
     * @param v 要乘以的向量
     * @param target 目标保存结果
     */
    transformVector3(v: Vector3, target = new Vector3())
    {
        // 与 vmult 是同一个纯函数，只是历史命名不同
        mat3Vmult(this, v, target);

        return target;
    }

    /**
     * 提取缩放分量（对应 `Matrix4x4.getScale`）。
     *
     * 行主序下第 j 列的长度即该轴的缩放（旋转不改变列长）。
     *
     * @param vout 输出向量
     */
    getScale(vout = new Vector3())
    {
        mat3GetScale(this, vout);

        return vout;
    }
}
