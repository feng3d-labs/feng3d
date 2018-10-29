namespace feng3d
{
    // /**
    //  * 欧拉角，使用分别绕x，y，z轴旋转角度表示方位
    //  */
    // export class Euler
    // {
    //     /**
    //      * x轴旋转角度
    //      */
    //     x = 0;

    //     /**
    //      * y轴旋转角度
    //      */
    //     y = 0;

    //     /**
    //      * z轴旋转角度
    //      */
    //     z = 0;

    //     /**
    //      * 构建欧拉角
    //      * @param x x轴旋转角度
    //      * @param y y轴旋转角度
    //      * @param z z轴旋转角度
    //      */
    //     constructor(x = 0, y = 0, z = 0)
    //     {
    //         this.x = x;
    //         this.y = y;
    //         this.z = z;
    //     }

    //     /**
    //      * 反转当前欧拉角
    //      */
    //     invert()
    //     {
    //         var euler = new Euler();
    //         euler.rotate(Vector3.Z_AXIS, -this.z);
    //         euler.rotate(Vector3.Y_AXIS, -this.y);
    //         euler.rotate(Vector3.X_AXIS, -this.x);
    //         this.copyFrom(euler);
    //     }

    //     /**
    //      * 绕指定轴旋转
    //      * @param    axis               旋转轴
    //      * @param    angle              旋转角度
    //      */
    //     rotate(axis: Vector3, angle: number)
    //     {
    //         var leftAngle = angle;
    //         if (Math.abs(leftAngle) >= 90)
    //         {
    //             var step = leftAngle / Math.abs(leftAngle) * 80;
    //             var stepMatrix = Matrix4x4.fromAxisRotate(axis, step);
    //             while (Math.abs(leftAngle) > 80)
    //             {
    //                 stepMatrix.transformRotation(this, this);
    //                 leftAngle = leftAngle - step;
    //             }
    //         }
    //         Matrix4x4.fromAxisRotate(axis, leftAngle).transformRotation(this, this);
    //         return this;
    //     }

    //     /**
    //      * 通过将另一个 Euler 对象与当前 Euler 对象相乘来后置一个欧拉角。
    //      * @param euler     欧拉角
    //      */
    //     append(euler: XYZ)
    //     {
    //         this.rotate(Vector3.X_AXIS, euler.x);
    //         this.rotate(Vector3.Y_AXIS, euler.y);
    //         this.rotate(Vector3.Z_AXIS, euler.z);
    //     }

    //     /**
    //      * 通过将当前 Euler 对象与另一个 Euler 对象相乘来前置一个欧拉角。
    //      * @param   euler     个右侧矩阵，它与当前 Matrix4x4 对象相乘。
    //      */
    //     prepend(euler: XYZ)
    //     {
    //         var eul = this.clone();
    //         this.copyFrom(euler);
    //         this.append(eul);
    //         return this;
    //     }

    //     /**
    //      * 后置 逆向euler
    //      * @param euler     欧拉角
    //      */
    //     appendInvert(euler: XYZ)
    //     {
    //         this.rotate(Vector3.Z_AXIS, -euler.z);
    //         this.rotate(Vector3.Y_AXIS, -euler.y);
    //         this.rotate(Vector3.X_AXIS, -euler.x);
    //     }

    //     /**
    //      * 变换欧拉角数据
    //      * @param source 需要转换的欧拉角数据
    //      * @param target 转换后的欧拉角数据
    //      */
    //     transformRotation<T extends { x: number, y: number, z: number }>(source: { x: number, y: number, z: number }, target?: T)
    //     {
    //         var thismatrix3d = this.toMatrix3D();
    //         target = target || <T>{};
    //         thismatrix3d.transformRotation(source, target);
    //         return target;
    //     }

    //     /**
    //      * 将源 Euler 对象中的所有矩阵数据复制到调用方 Euler 对象中。
    //      * @param   source      要从中复制数据的 Euler 对象。
    //      */
    //     copyFrom(source: { x: number, y: number, z: number })
    //     {
    //         this.x = source.x;
    //         this.y = source.y;
    //         this.z = source.z;
    //         return this;
    //     }

    //     /**
    //      * 输出为矩阵
    //      */
    //     toMatrix3D()
    //     {
    //         return Matrix4x4.fromRotation(this);
    //     }

    //     /**
    //      * 通过将当前 Euler 对象的 x、y 和 z 元素与指定的 Euler 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
    //      */
    //     equals(object: { x: number, y: number, z: number }, precision = FMath.PRECISION)
    //     {
    //         if (Math.abs(this.x - object.x) > precision)
    //             return false;
    //         if (Math.abs(this.y - object.y) > precision)
    //             return false;
    //         if (Math.abs(this.z - object.z) > precision)
    //             return false;
    //         return true;
    //     }

    //     /**
    //      * 返回一个新 Euler 对象，它是与当前 Euler 对象完全相同的副本。
    //      */
    //     clone()
    //     {
    //         var ret = new Euler(this.x, this.y, this.z);
    //         return ret;
    //     }
    // }
}