import { mathUtil } from '@feng3d/polyfill';
import { RotationOrder } from '../enums/RotationOrder';
import type { Matrix4x4 } from './Matrix4x4';
import type { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';
import {
    eulerCopy,
    eulerEquals,
    eulerFromArray,
    eulerFromQuaternion,
    eulerFromRotationMatrix,
    eulerFromVector3,
    eulerRandom,
    eulerReorder,
    eulerSet,
    eulerToArray,
    eulerToVector3,
} from './eulerOps';

/**
 * 欧拉角
 *
 * 由特定的顺序分别围绕X、Y、Z三个轴进行旋转。
 *
 * @see https://github.com/mrdoob/three.js/blob/dev/src/math/Euler.js
 */
export class Euler
{
    /**
     * 围绕X轴旋转角度。
     */
    x: number;

    /**
     * 围绕Y轴旋转角度。
     */
    y: number;

    /**
     * 围绕Z轴旋转角度。
     */
    z: number;

    /**
     * X、Y、Z轴旋顺序。
     */
    order: RotationOrder;

    /**
     * 构建欧拉角。
     *
     * @param x 围绕X轴旋转角度。
     * @param y 围绕Y轴旋转角度。
     * @param z 围绕Z轴旋转角度。
     * @param order X、Y、Z轴旋顺序。
     */
    constructor(x = 0, y = 0, z = 0, order = mathUtil.DefaultRotationOrder)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.order = order;
    }

    /**
     * 设置欧拉角初始值。
     *
     * @param x 围绕X轴旋转角度。
     * @param y 围绕Y轴旋转角度。
     * @param z 围绕Z轴旋转角度。
     * @param order X、Y、Z轴旋顺序。
     */
    set(x: number, y: number, z: number, order?: RotationOrder)
    {
        eulerSet(x, y, z, order, this);

        return this;
    }

    /**
     * 随机欧拉角（弧度）。
     */
    random()
    {
        eulerRandom(this);

        return this;
    }

    /**
     * 克隆欧拉角。
     */
    clone()
    {
        const result = new Euler();

        eulerCopy(this, result);

        return result;
    }

    /**
     * 从旋转矩阵初始化欧拉角。
     *
     * @param rotationMatrix 仅包含旋转的矩阵。
     * @param order X、Y、Z轴旋顺序。
     * @returns 从旋转矩阵初始化的欧拉角。
     */
    fromRotationMatrix(rotationMatrix: Matrix4x4, order?: RotationOrder)
    {
        eulerFromRotationMatrix(this, rotationMatrix, order, this);

        return this;
    }

    /**
     * 从四元素初始化欧拉角。
     *
     * @param q 四元素。
     * @param order X、Y、Z轴旋顺序。
     * @returns 初始化后的四元素。
     */
    fromQuaternion(q: Quaternion, order?: RotationOrder)
    {
        eulerFromQuaternion(this, q, order, this);

        return this;
    }

    /**
     * 从三个轴的旋转角度初始化四元素。
     *
     * @param v 存储X、Y、Z轴旋转量的向量。
     * @param order X、Y、Z轴旋顺序。
     * @returns 初始化后的四元素。
     */
    fromVector3(v: Vector3, order?: RotationOrder)
    {
        eulerFromVector3(this, v, order, this);

        return this;
    }

    /**
     * 在不改变旋转量的情况下更换X、Y、Z轴旋顺序。
     *
     * @param newOrder 新的X、Y、Z轴旋顺序。
     * @returns 重置旋转角度。
     */
    reorder(newOrder: RotationOrder)
    {
        eulerReorder(this, newOrder, this);

        return this;
    }

    /**
     * 判断与指定欧拉角是否相等。
     *
     * @param euler 被比较的欧拉角。
     * @returns 如果值为true则两个欧拉角相等，否则不相等。
     */
    equals(euler: Euler)
    {
        return eulerEquals(this, euler);
    }

    /**
     * 从数组初始化欧拉角。
     *
     * @param array 存储X、Y、Z轴旋角度以及旋转顺序的数组。
     * @param offset 数组中存储便宜位置。
     * @returns 初始化后的四元素。
     */
    fromArray(array: number[], offset = 0)
    {
        eulerFromArray(array, offset, this);

        return this;
    }

    /**
     * 转换为存储X、Y、Z轴旋转角度以及旋转顺序的数组。
     *
     * @param array 存储X、Y、Z轴旋转角度以及旋转顺序的数组。
     * @param offset 数组中存储便宜位置。
     * @returns 存储X、Y、Z轴旋转角度以及旋转顺序的数组。
     */
    toArray(array: number[] = [], offset = 0): number[]
    {
        return eulerToArray(this, array, offset);
    }

    /**
     * 转换为存储X、Y、Z轴旋转角度的向量。
     *
     * @param vector3 存储X、Y、Z轴旋转角度的向量。
     * @returns 存储X、Y、Z轴旋转角度的向量。
     */
    toVector3(vector3 = new Vector3())
    {
        // 必须写回 vector3 再返回：直接 return ops 结果会把返回类型退化成 WritableVector3Like
        eulerToVector3(this, vector3);

        return vector3;
    }
}
