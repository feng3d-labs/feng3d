namespace feng3d
{
    export interface IVector3
    {
        x: number;
        y: number;
        z: number;
    }

    /**
     * Vector3 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置
     */
    export class Vector3 implements Vector
    {
        __class__: "feng3d.Vector3";

        /**
        * 定义为 Vector3 对象的 x 轴，坐标为 (1,0,0)。
        */
        static X_AXIS = Object.freeze(new Vector3(1, 0, 0));

        /**
        * 定义为 Vector3 对象的 y 轴，坐标为 (0,1,0)
        */
        static Y_AXIS = Object.freeze(new Vector3(0, 1, 0));

        /**
        * 定义为 Vector3 对象的 z 轴，坐标为 (0,0,1)
        */
        static Z_AXIS = Object.freeze(new Vector3(0, 0, 1));

        /**
         * 原点 Vector3(0,0,0)
         */
        static ZERO = Object.freeze(new Vector3());

        /**
         * Vector3(1, 1, 1)
         */
        static ONE = Object.freeze(new Vector3(1, 1, 1));

        /**
         * 从数组中初始化向量
         * @param array 数组
         * @param offset 偏移
         * @return 返回新向量
         */
        static fromArray(array: ArrayLike<number>, offset = 0)
        {
            return new Vector3().fromArray(array, offset);
        }

        /**
         * 随机三维向量
         * 
         * @param size 尺寸
         * @param double 如果值为false，随机范围在[0,size],否则[-size,size]。默认为false。
         */
        static random(size = 1, double = false)
        {
            var v = new Vector3(Math.random(), Math.random(), Math.random());
            if (double) v.scaleNumber(2).subNumber(1);
            v.scaleNumber(size);
            return v;
        }

        /**
         * 从Vector2初始化
         */
        static fromVector2(vector: Vector2, z = 0)
        {
            return new Vector3().fromVector2(vector, z);
        }

        /**
        * Vector3 对象中的第一个元素，例如，三维空间中某个点的 x 坐标。默认值为 0
        */
        @serialize
        @oav()
        x = 0;

        /**
         * Vector3 对象中的第二个元素，例如，三维空间中某个点的 y 坐标。默认值为 0
         */
        @serialize
        @oav()
        y = 0;

        /**
         * Vector3 对象中的第三个元素，例如，三维空间中某个点的 z 坐标。默认值为 0
         */
        @serialize
        @oav()
        z = 0;

        /**
        * 当前 Vector3 对象的长度（大小），即从原点 (0,0,0) 到该对象的 x、y 和 z 坐标的距离。w 属性将被忽略。单位矢量具有的长度或大小为一。
        */
        get length(): number
        {
            return Math.sqrt(this.lengthSquared);
        }

        /**
        * 当前 Vector3 对象长度的平方，它是使用 x、y 和 z 属性计算出来的。w 属性将被忽略。尽可能使用 lengthSquared() 方法，而不要使用 Vector3.length() 方法的 Math.sqrt() 方法调用，后者速度较慢。
        */
        get lengthSquared(): number
        {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        }

        /**
         * 创建 Vector3 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector3 对象。
         * @param x 第一个元素，例如 x 坐标。
         * @param y 第二个元素，例如 y 坐标。
         * @param z 第三个元素，例如 z 坐标。
         */
        constructor(x = 0, y = 0, z = 0)
        {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        /**
         * 将 Vector3 的成员设置为指定值
         */
        set(x: number, y: number, z: number)
        {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }

        /**
         * 把所有分量都设为零
         */
        setZero()
        {
            this.x = this.y = this.z = 0;
        }

        /**
         * 从Vector2初始化
         */
        fromVector2(vector: Vector2, z = 0)
        {
            this.x = vector.x;
            this.y = vector.y;
            this.z = z;
            return this;
        }

        fromArray(array: ArrayLike<number>, offset = 0)
        {
            this.x = array[offset];
            this.y = array[offset + 1];
            this.z = array[offset + 2];
            return this;
        }

        /**
         * 转换为Vector2
         */
        toVector2(vector = new Vector2())
        {
            return vector.set(this.x, this.y);
        }

        /**
         * 转换为Vector4
         */
        toVector4(vector4 = new Vector4())
        {
            vector4.x = this.x;
            vector4.y = this.y;
            vector4.z = this.z;
            return vector4;
        }

        /**
         * 加上指定向量
         * @param v 加向量
         */
        add(v: Vector3)
        {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        }

        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        addTo(v: Vector3, vout = new Vector3())
        {
            vout.x = this.x + v.x;
            vout.y = this.y + v.y;
            vout.z = this.z + v.z;
            return vout;
        }

        /**
         * 减去向量
         * @param a 减去的向量
         * @return 返回新向量
         */
        sub(a: Vector3)
        {
            this.x -= a.x;
            this.y -= a.y;
            this.z -= a.z;
            return this;
        }

        /**
         * 减去向量返回新向量
         * @param v 减去的向量
         * @return 返回的新向量
         */
        subTo(v: Vector3, vout = new Vector3())
        {
            vout.x = this.x - v.x;
            vout.y = this.y - v.y;
            vout.z = this.z - v.z;
            return vout;
        }

        /**
         * 乘以向量
         * @param v 向量
         */
        multiply(v: Vector3)
        {
            this.x *= v.x;
            this.y *= v.y;
            this.z *= v.z;
            return this;
        }

        /**
         * 乘以向量
         * @param v 向量
         * @param vout 输出向量
         */
        multiplyTo(v: Vector3, vout = new Vector3())
        {
            vout.x = this.x * v.x;
            vout.y = this.y * v.y;
            vout.z = this.z * v.z;
            return vout;
        }

        /**
         * 除以向量
         * @param a 向量
         */
        divide(a: Vector3)
        {
            this.x /= a.x;
            this.y /= a.y;
            this.z /= a.z;
            return this;
        }

        /**
         * 除以向量
         * @param a 向量
         * @param vout 输出向量 
         */
        divideTo(a: Vector3, vout = new Vector3())
        {
            vout.x = this.x / a.x;
            vout.y = this.y / a.y;
            vout.z = this.z / a.z;
            return vout;
        }

        /**
         * 通过将当前 Vector3 对象的 x、y 和 z 元素与指定的 Vector3 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
         */
        equals(v: Vector3, precision = Math.PRECISION)
        {
            if (!Math.equals(this.x - v.x, 0, precision))
                return false;
            if (!Math.equals(this.y - v.y, 0, precision))
                return false;
            if (!Math.equals(this.z - v.z, 0, precision))
                return false;
            return true;
        }

        /**
         * 将源 Vector3 对象中的所有矢量数据复制到调用方 Vector3 对象中。
         * @return 要从中复制数据的 Vector3 对象。
         */
        copy(v: Vector3)
        {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            return this;
        }

        /**
         * 与目标点之间的距离
         * @param p 目标点
         */
        distance(p: Vector3)
        {
            var dx = this.x - p.x, dy = this.y - p.y, dz = this.z - p.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }

        /**
         * 与目标点之间的距离平方
         * @param p 目标点
         */
        distanceSquared(p: Vector3)
        {
            var dx = this.x - p.x, dy = this.y - p.y, dz = this.z - p.z;
            return dx * dx + dy * dy + dz * dz;
        }

        /**
         * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3 对象转换为单位矢量。
         */
        normalize(thickness = 1)
        {
            var length = this.lengthSquared
            if (length > 0)
            {
                length = Math.sqrt(length);
                var invLength = thickness / length;
                this.x *= invLength;
                this.y *= invLength;
                this.z *= invLength;
            } else
            {
                // Make something up
                this.x = 0;
                this.y = 0;
                this.z = 0;
            }
            return this;
        }

        /**
         * Scale a vector and add it to this vector. Save the result in "this". (this = this + vector * scalar)
         * @param scalar
         * @param vector
         * @param  target The vector to save the result in.
         */
        addScaledVector(scalar: number, vector: Vector3)
        {
            this.x = this.x + scalar * vector.x;
            this.y = this.y + scalar * vector.y;
            this.z = this.z + scalar * vector.z;
            return this;
        }

        /**
         * Scale a vector and add it to this vector. Save the result in "target". (target = this + vector * scalar)
         * @param scalar
         * @param vector
         * @param  target The vector to save the result in.
         */
        addScaledVectorTo(scalar: number, vector: Vector3, target = new Vector3())
        {
            target.x = this.x + scalar * vector.x;
            target.y = this.y + scalar * vector.y;
            target.z = this.z + scalar * vector.z;
            return target;
        }

        /**
         * 叉乘向量
         * @param a 向量
         */
        cross(a: Vector3): Vector3
        {
            return this.set(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x);
        }

        /**
         * 叉乘向量
         * @param a 向量
         * @param vout 输出向量
         */
        crossTo(a: Vector3, vout = new Vector3())
        {
            vout.set(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x);
            return vout;
        }

        /**
         * 如果当前 Vector3 对象和作为参数指定的 Vector3 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        dot(a: Vector3)
        {
            return this.x * a.x + this.y * a.y + this.z * a.z;
        }

        /**
         * 是否为零向量
         */
        isZero()
        {
            return this.x === 0 && this.y === 0 && this.z === 0;
        }

        tangents(t1: Vector3, t2: Vector3)
        {
            var norm = this.length;
            if (norm > 0.0)
            {
                var n = new Vector3();
                var inorm = 1 / norm;
                n.set(this.x * inorm, this.y * inorm, this.z * inorm);
                var randVec = new Vector3();
                if (Math.abs(n.x) < 0.9)
                {
                    randVec.set(1, 0, 0);
                    n.crossTo(randVec, t1);
                } else
                {
                    randVec.set(0, 1, 0);
                    n.crossTo(randVec, t1);
                }
                n.crossTo(t1, t2);
            } else
            {
                // The normal length is zero, make something up
                t1.set(1, 0, 0);
                t2.set(0, 1, 0);
            }
        }

        /**
         * 检查一个向量是否接近零
         * 
         * @param precision
         */
        almostZero(precision = Math.PRECISION)
        {
            if (Math.abs(this.x) > precision ||
                Math.abs(this.y) > precision ||
                Math.abs(this.z) > precision)
            {
                return false;
            }
            return true;
        }

        /**
         * 检查这个向量是否与另一个向量反平行。
         * 
         * @param  v
         * @param  precision 设置为零以进行精确比较
         */
        isAntiparallelTo(v: Vector3, precision = Math.PRECISION)
        {
            var t = new Vector3();
            this.negateTo(t);
            return t.equals(v, precision);
        }

        /**
         * 加上标量
         * @param n 标量
         */
        addNumber(n: number)
        {
            this.x += n;
            this.y += n;
            this.z += n;
            return this;
        }

        /**
         * 增加标量
         * @param n 标量
         */
        addNumberTo(n: number, vout = new Vector3())
        {
            vout.x = this.x + n;
            vout.y = this.y + n;
            vout.z = this.z + n;
            return vout;
        }

        /**
         * 减去标量
         * @param n 标量
         */
        subNumber(n: number)
        {
            this.x -= n;
            this.y -= n;
            this.z -= n;
            return this;
        }

        /**
         * 减去标量
         * @param n 标量
         */
        subNumberTo(n: number, vout = new Vector3())
        {
            vout.x = this.x - n;
            vout.y = this.y - n;
            vout.z = this.z - n;
            return vout;
        }

        /**
         * 乘以标量
         * @param n 标量
         */
        multiplyNumber(n: number)
        {
            this.x *= n;
            this.y *= n;
            this.z *= n;
            return this;
        }

        /**
         * 乘以标量
         * @param n 标量
         * @param vout 输出向量
         */
        multiplyNumberTo(n: number, vout = new Vector3())
        {
            vout.x = this.x * n;
            vout.y = this.y * n;
            vout.z = this.z * n;
            return vout;
        }

        /**
         * 除以标量
         * @param n 标量
         */
        divideNumber(n: number)
        {
            this.x /= n;
            this.y /= n;
            this.z /= n;
            return this;
        }

        /**
         * 除以标量
         * @param n 标量
         * @param vout 输出向量 
         */
        divideNumberTo(n: number, vout = new Vector3())
        {
            vout.x = this.x / n;
            vout.y = this.y / n;
            vout.z = this.z / n;
            return vout;
        }

        /**
         * 返回一个新 Vector3 对象，它是与当前 Vector3 对象完全相同的副本。
         * @return 一个新 Vector3 对象，它是当前 Vector3 对象的副本。
         */
        clone()
        {
            return new Vector3(this.x, this.y, this.z);
        }

        /**
         * 负向量
         * (a,b,c)->(-a,-b,-c)
         */
        negate()
        {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;
            return this;
        }

        /**
         * 负向量
         * (a,b,c)->(-a,-b,-c)
         */
        negateTo(vout = new Vector3())
        {
            vout.x = -this.x;
            vout.y = -this.y;
            vout.z = -this.z;
            return vout;
        }

        /**
         * 倒向量
         * (a,b,c)->(1/a,1/b,1/c)
         */
        inverse()
        {
            this.x = 1 / this.x;
            this.y = 1 / this.y;
            this.z = 1 / this.z;
            return this;
        }

        /**
         * 倒向量
         * (a,b,c)->(1/a,1/b,1/c)
         */
        inverseTo(vout = new Vector3())
        {
            vout.x = 1 / this.x;
            vout.y = 1 / this.y;
            vout.z = 1 / this.z;
            return vout;
        }

        /**
         * 得到这个向量长度为1
         */
        unit(target: Vector3 = new Vector3())
        {
            var x = this.x, y = this.y, z = this.z;
            var ninv = x * x + y * y + z * z;
            if (ninv > 0.0)
            {
                var ninv = Math.sqrt(ninv);
                ninv = 1.0 / ninv;
                target.x = x * ninv;
                target.y = y * ninv;
                target.z = z * ninv;
            } else
            {
                target.x = 1;
                target.y = 0;
                target.z = 0;
            }
            return target;
        }

        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        scaleNumber(s: number)
        {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            return this;
        }

        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        scaleNumberTo(s: number, vout = new Vector3())
        {
            vout.x = this.x * s;
            vout.y = this.y * s;
            vout.z = this.z * s;
            return vout;
        }

        /**
         * 缩放
         * @param s 缩放量
         */
        scale(s: Vector3)
        {
            this.x *= s.x;
            this.y *= s.y;
            this.z *= s.z;
            return this;
        }

        /**
         * 缩放
         * @param s 缩放量
         */
        scaleTo(s: Vector3, vout = new Vector3())
        {
            vout.x = this.x * s.x;
            vout.y = this.y * s.y;
            vout.z = this.z * s.z;
            return vout;
        }

        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerp(v: Vector3, alpha: Vector3)
        {
            this.x += (v.x - this.x) * alpha.x;
            this.y += (v.y - this.y) * alpha.y;
            this.z += (v.z - this.z) * alpha.z;
            return this;
        }

        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerpTo(v: Vector3, alpha: Vector3, vout = new Vector3())
        {
            vout.x = this.x + (v.x - this.x) * alpha.x;
            vout.y = this.y + (v.y - this.y) * alpha.y;
            vout.z = this.z + (v.z - this.z) * alpha.z;
            return vout;
        }

        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerpNumber(v: Vector3, alpha: number)
        {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;
            this.z += (v.z - this.z) * alpha;
            return this;
        }

        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerpNumberTo(v: Vector3, alpha: number, vout = new Vector3())
        {
            vout.x = this.x + (v.x - this.x) * alpha;
            vout.y = this.y + (v.y - this.y) * alpha;
            vout.z = this.z + (v.z - this.z) * alpha;
            return vout;
        }

        /**
         * 小于指定点
         * @param p 点
         */
        less(p: Vector3)
        {
            return this.x < p.x && this.y < p.y && this.z < p.z;
        }

        /**
         * 小于等于指定点
         * @param p 点
         */
        lessequal(p: Vector3)
        {
            return this.x <= p.x && this.y <= p.y && this.z <= p.z;
        }

        /**
         * 大于指定点
         * @param p 点
         */
        greater(p: Vector3)
        {
            return this.x > p.x && this.y > p.y && this.z > p.z;
        }

        /**
         * 大于等于指定点
         * @param p 点
         */
        greaterequal(p: Vector3)
        {
            return this.x >= p.x && this.y >= p.y && this.z >= p.z;
        }

        /**
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        clamp(min: Vector3, max: Vector3)
        {
            this.x = Math.clamp(this.x, min.x, max.x);
            this.y = Math.clamp(this.y, min.y, max.y);
            this.z = Math.clamp(this.z, min.z, max.z);
            return this;
        }

        /**
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        clampTo(min: Vector3, max: Vector3, vout = new Vector3())
        {
            return vout.copy(this).clamp(min, max);
        }

        /**
         * 取最小元素
         * @param v 向量
         */
        min(v: Vector3)
        {
            this.x = Math.min(this.x, v.x);
            this.y = Math.min(this.y, v.y);
            this.z = Math.min(this.z, v.z);
            return this;
        }

        /**
         * 取最大元素
         * @param v 向量
         */
        max(v: Vector3)
        {
            this.x = Math.max(this.x, v.x);
            this.y = Math.max(this.y, v.y);
            this.z = Math.max(this.z, v.z);
            return this;
        }

        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        applyMatrix4x4(mat: Matrix4x4)
        {
            mat.transformPoint3(this, this);
            return this;
        }

        /**
         * 应用四元素
         * @param q 四元素
         */
        applyQuaternion(q: Quaternion)
        {
            var x = this.x, y = this.y, z = this.z;
            var qx = q.x, qy = q.y, qz = q.z, qw = q.w;

            // calculate quat * vector

            var ix = qw * x + qy * z - qz * y;
            var iy = qw * y + qz * x - qx * z;
            var iz = qw * z + qx * y - qy * x;
            var iw = - qx * x - qy * y - qz * z;

            // calculate result * inverse quat

            this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
            this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
            this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

            return this;
        }

        /**
         * 反射
         * @param normal 
         */
        reflect(normal: Vector3)
        {
            return this.sub(normal.multiplyNumberTo(2 * this.dot(normal)));
        }

        /**
         * 向下取整
         */
        floor()
        {
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);
            this.z = Math.floor(this.z);
            return this;
        }

        /**
         * 向上取整
         */
        ceil()
        {
            this.x = Math.ceil(this.x);
            this.y = Math.ceil(this.y);
            this.z = Math.ceil(this.z);
            return this;
        }

        /**
         * 四舍五入
         */
        round()
        {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            this.z = Math.round(this.z);
            return this;
        }

        /**
         * 向0取整
         */
        roundToZero()
        {
            this.x = (this.x < 0) ? Math.ceil(this.x) : Math.floor(this.x);
            this.y = (this.y < 0) ? Math.ceil(this.y) : Math.floor(this.y);
            this.z = (this.z < 0) ? Math.ceil(this.z) : Math.floor(this.z);
            return this;
        }

        /**
         * 与指定向量是否平行
         * @param v 向量
         */
        isParallel(v: Vector3, precision = Math.PRECISION)
        {
            return Math.equals(this.crossTo(v).lengthSquared, 0, precision);
        }

        /**
         * 从向量中得到叉乘矩阵a_cross，使得a x b = a_cross * b = c
         * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
         */
        crossmat()
        {
            return new Matrix3x3([0, -this.z, this.y,
                this.z, 0, -this.x,
                -this.y, this.x, 0]);
        }

        /**
         * 返回当前 Vector3 对象的字符串表示形式。
         */
        toString(): string
        {
            return "<" + this.x + ", " + this.y + ", " + this.z + ">";
        }

        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         * @return 返回数组
         */
        toArray(array: number[] = [], offset = 0)
        {
            array[offset] = this.x;
            array[offset + 1] = this.y;
            array[offset + 2] = this.z;
            return array;
        }
    }
}