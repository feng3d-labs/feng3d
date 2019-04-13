namespace feng3d
{
    /**
     * Vector3 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置

     */
    export class Vector3
    {

        __class__: "feng3d.Vector3" = "feng3d.Vector3";

        /**
        * 定义为 Vector3 对象的 x 轴，坐标为 (1,0,0)。
        */
        static X_AXIS = new Vector3(1, 0, 0);

        /**
        * 定义为 Vector3 对象的 y 轴，坐标为 (0,1,0)
        */
        static Y_AXIS = new Vector3(0, 1, 0);

        /**
        * 定义为 Vector3 对象的 z 轴，坐标为 (0,0,1)
        */
        static Z_AXIS = new Vector3(0, 0, 1);

        /**
         * 原点
         */
        static ZERO = new Vector3();

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
         * @param size 尺寸
         */
        static random(size = 1)
        {
            return new Vector3(Math.random() * size, Math.random() * size, Math.random() * size);
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
        init(x: number, y: number, z: number)
        {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
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
            return vector.init(this.x, this.y);
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
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        add(a: Vector3)
        {
            this.x += a.x;
            this.y += a.y;
            this.z += a.z;
            return this;
        }

        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        addTo(a: Vector3, vout = new Vector3())
        {
            return vout.copy(this).add(a);
        }

        /**
         * 乘以向量
         * @param a 向量
         */
        multiply(a: Vector3)
        {
            this.x *= a.x;
            this.y *= a.y;
            this.z *= a.z;
            return this;
        }

        /**
         * 乘以向量
         * @param a 向量
         * @param vout 输出向量
         */
        multiplyTo(a: Vector3, vout = new Vector3())
        {
            return vout.copy(this).multiply(a);
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
            return vout.copy(this).divide(a);
        }

        /**
         * 叉乘向量
         * @param a 向量
         */
        cross(a: Vector3): Vector3
        {
            return this.init(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x);
        }

        /**
         * 叉乘向量
         * @param a 向量
         * @param vout 输出向量
         */
        crossTo(a: Vector3, vout = new Vector3()): Vector3
        {
            return vout.copy(this).cross(a);
        }

        /**
         * 如果当前 Vector3 对象和作为参数指定的 Vector3 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        dot(a: Vector3)
        {
            return this.x * a.x + this.y * a.y + this.z * a.z;
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
            return vout.copy(this).addNumber(n);
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
            return vout.copy(this).subNumber(n);
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
            return vout.copy(this).multiplyNumber(n);
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
            return vout.copy(this).divideNumber(n);
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
         * 通过将当前 Vector3 对象的 x、y 和 z 元素与指定的 Vector3 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
         */
        equals(object: Vector3, precision = FMath.PRECISION)
        {
            if (!FMath.equals(this.x - object.x, 0, precision))
                return false;
            if (!FMath.equals(this.y - object.y, 0, precision))
                return false;
            if (!FMath.equals(this.z - object.z, 0, precision))
                return false;
            return true;
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
            return vout.copy(this).negate();
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
            return vout.copy(this).inverse();
        }

        /**
         * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3 对象转换为单位矢量。
         */
        normalize(thickness = 1)
        {
            if (this.length != 0)
            {
                var invLength = thickness / this.length;
                this.x *= invLength;
                this.y *= invLength;
                this.z *= invLength;
            }
            return this;
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
            return vout.copy(this).scaleNumber(s);
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
            return vout.copy(this).scale(s);
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
         * 减去向量
         * @param a 减去的向量
         * @return 返回新向量
         */
        subTo(a: Vector3, vout = new Vector3())
        {
            return vout.copy(this).sub(a);
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
            return vout.copy(this).lerp(v, alpha);
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
            return vout.copy(this).lerpNumber(v, alpha);
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
            this.x = FMath.clamp(this.x, min.x, max.x);
            this.y = FMath.clamp(this.y, min.y, max.y);
            this.z = FMath.clamp(this.z, min.z, max.z);
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
            mat.transformVector(this, this);
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
         * 与点之间的距离平方
         * @param v 点
         */
        distanceSquared(v: Vector3)
        {
            var dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;
            return dx * dx + dy * dy + dz * dz;
        }

        /**
         * 与点之间的距离平方
         * @param v 点
         */
        distance(v: Vector3)
        {
            return Math.sqrt(this.distanceSquared(v));
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
        isParallel(v: Vector3, precision = FMath.PRECISION)
        {
            return FMath.equals(Math.abs(this.clone().normalize().dot(v.clone().normalize())), 1, precision);
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