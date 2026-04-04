import { mathUtil } from '../../polyfill/MathUtil';
import { RotationOrder } from '../enums/RotationOrder';
import { Matrix4x4 } from './Matrix4x4';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

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
        this.x = x;
        this.y = y;
        this.z = z;
        if (order !== undefined)
        {
            this.order = order;
        }

        return this;
    }

    /**
     * 随机欧拉角。
     */
    random()
    {
        this.x = Math.random() * 360;
        this.y = Math.random() * 360;
        this.z = Math.random() * 360;
        this.order = mathUtil.randInt(0, 5);

        return this;
    }

    /**
     * 克隆欧拉角。
     */
    clone()
    {
        return new Euler(this.x, this.y, this.z, this.order);
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
        const te = rotationMatrix.elements;
        const m11 = te[0];
        const m12 = te[4];
        const m13 = te[8];
        const m21 = te[1];
        const m22 = te[5];
        const m23 = te[9];
        const m31 = te[2];
        const m32 = te[6];
        const m33 = te[10];

        if (order === undefined)
        {
            order = this.order;
        }

        let x: number;
        let y: number;
        let z: number;

        switch (order)
        {
            case RotationOrder.XYZ:
                y = Math.asin(mathUtil.clamp(m13, -1, 1));
                if (Math.abs(m13) < 0.9999999)
                {
                    x = Math.atan2(-m23, m33);
                    z = Math.atan2(-m12, m11);
                }
                else
                {
                    x = Math.atan2(m32, m22);
                    z = 0;
                }
                break;
            case RotationOrder.YXZ:
                x = Math.asin(-mathUtil.clamp(m23, -1, 1));
                if (Math.abs(m23) < 0.9999999)
                {
                    y = Math.atan2(m13, m33);
                    z = Math.atan2(m21, m22);
                }
                else
                {
                    y = Math.atan2(-m31, m11);
                    z = 0;
                }
                break;

            case RotationOrder.ZXY:
                x = Math.asin(mathUtil.clamp(m32, -1, 1));
                if (Math.abs(m32) < 0.9999999)
                {
                    y = Math.atan2(-m31, m33);
                    z = Math.atan2(-m12, m22);
                }
                else
                {
                    y = 0;
                    z = Math.atan2(m21, m11);
                }
                break;

            case RotationOrder.ZYX:
                y = Math.asin(-mathUtil.clamp(m31, -1, 1));
                if (Math.abs(m31) < 0.9999999)
                {
                    x = Math.atan2(m32, m33);
                    z = Math.atan2(m21, m11);
                }
                else
                {
                    x = 0;
                    z = Math.atan2(-m12, m22);
                }
                break;
            case RotationOrder.YZX:
                z = Math.asin(mathUtil.clamp(m21, -1, 1));
                if (Math.abs(m21) < 0.9999999)
                {
                    x = Math.atan2(-m23, m22);
                    y = Math.atan2(-m31, m11);
                }
                else
                {
                    x = 0;
                    y = Math.atan2(m13, m33);
                }
                break;

            case RotationOrder.XZY:
                z = Math.asin(-mathUtil.clamp(m12, -1, 1));
                if (Math.abs(m12) < 0.9999999)
                {
                    x = Math.atan2(m32, m22);
                    y = Math.atan2(m13, m11);
                }
                else
                {
                    x = Math.atan2(-m23, m33);
                    y = 0;
                }
                break;
            default:
                console.warn(`Euler: .fromRotationMatrix() encountered an unknown order: ${order}`);
        }

        this.x = x * mathUtil.RAD2DEG;
        this.y = y * mathUtil.RAD2DEG;
        this.z = z * mathUtil.RAD2DEG;
        this.order = order;

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
        if (order === undefined)
        {
            order = this.order;
        }

        const matrix = new Matrix4x4();
        matrix.fromQuaternion(q);

        return this.fromRotationMatrix(matrix, order);
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
        if (order === undefined)
        {
            order = this.order;
        }

        return this.set(v.x, v.y, v.z, order);
    }

    /**
     * 在不改变旋转量的情况下更换X、Y、Z轴旋顺序。
     *
     * @param newOrder 新的X、Y、Z轴旋顺序。
     * @returns 重置旋转角度。
     */
    reorder(newOrder: RotationOrder)
    {
        const quaternion = new Quaternion();

        quaternion.fromEuler(this.x, this.y, this.z, this.order);

        return this.fromQuaternion(quaternion, newOrder);
    }

    /**
     * 判断与指定欧拉角是否相等。
     *
     * @param euler 被比较的欧拉角。
     * @returns 如果值为true则两个欧拉角相等，否则不相等。
     */
    equals(euler: Euler)
    {
        return (euler.x === this.x) && (euler.y === this.y) && (euler.z === this.z) && (euler.order === this.order);
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
        this.x = array[offset];
        this.y = array[offset + 1];
        this.z = array[offset + 2];
        this.order = array[offset + 3];

        return this;
    }

    /**
     * 转换为存储X、Y、Z轴旋转角度以及旋转顺序的数组。
     *
     * @param array 存储X、Y、Z轴旋转角度以及旋转顺序的数组。
     * @param offset 数组中存储便宜位置。
     * @returns 存储X、Y、Z轴旋转角度以及旋转顺序的数组。
     */
    toArray(array: number[] = [], offset = 0)
    {
        array[offset] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;
        array[offset + 3] = this.order;

        return array;
    }
}
