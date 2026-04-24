namespace feng3d
{

    /**
     * 四维向量
     */
    export class Vector4
    {
        __class__: 'feng3d.Vector4';

        static fromArray(array: ArrayLike<number>, offset = 0)
        {
            return new Vector4().fromArray(array, offset);
        }

        static fromVector3(vector3: Vector3, w = 0)
        {
            return new Vector4().fromVector3(vector3, w);
        }

        static random()
        {
            return new Vector4(Math.random(), Math.random(), Math.random(), Math.random());
        }

        /**
        * Vector4 对象中的第一个元素。默认值为 0
        */
        @serialize
        @oav()
        x = 0;

        /**
         * Vector4 对象中的第二个元素。默认值为 0
         */
        @serialize
        @oav()
        y = 0;

        /**
         * Vector4 对象中的第三个元素。默认值为 0
         */
        @serialize
        @oav()
        z = 0;

        /**
         * Vector4 对象的第四个元素。默认值为 0
         */
        @serialize
        @oav()
        w = 0;

        /**
         * 创建 Vector4 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector4 对象。
         * @param x 第一个元素
         * @param y 第二个元素
         * @param z 第三个元素
         * @param w 第四个元素
         */
        constructor(x = 0, y = 0, z = 0, w = 0)
        {
            this.set(x, y, z, w);
        }

        /**
         * 初始化向量
         * @param x 第一个元素
         * @param y 第二个元素
         * @param z 第三个元素
         * @param w 第四个元素
         * @returns 返回自身
         */
        set(x: number, y: number, z = 0, w = 0)
        {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;

            return this;
        }

        /**
         * 从数组初始化
         * @param array 提供数据的数组
         * @param offset 数组中起始位置
         * @returns 返回自身
         */
        fromArray(array: ArrayLike<number>, offset = 0)
        {
            this.x = array[offset];
            this.y = array[offset + 1];
            this.z = array[offset + 2];
            this.w = array[offset + 3];

            return this;
        }

        /**
         * 从三维向量初始化
         * @param vector3 三维向量
         * @param w 向量第四个值
         * @returns 返回自身
         */
        fromVector3(vector3: Vector3, w = 0)
        {
            this.x = vector3.x;
            this.y = vector3.y;
            this.z = vector3.z;
            this.w = w;

            return this;
        }

        /**
         * 转换为三维向量
         * @param v3 三维向量
         */
        toVector3(v3 = new Vector3())
        {
            v3.set(this.x, this.y, this.z);

            return v3;
        }

        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        toArray(array: number[] = [], offset = 0)
        {
            array[offset] = this.x;
            array[offset + 1] = this.y;
            array[offset + 2] = this.z;
            array[offset + 3] = this.w;

            return array;
        }

        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @returns 返回新向量
         */
        add(v: Vector4)
        {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            this.w += v.w;

            return this;
        }

        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @returns 返回新向量
         */
        addTo(v: Vector4, vout = new Vector4())
        {
            return vout.copy(this).add(v);
        }

        /**
         * 克隆一个向量
         * @returns 返回一个拷贝向量
         */
        clone()
        {
            return new Vector4(this.x, this.y, this.z, this.w);
        }

        /**
         * 从指定向量拷贝数据
         * @param v 被拷贝向量
         * @returns 返回自身
         */
        copy(v: Vector4)
        {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            this.w = v.w;

            return this;
        }

        /**
         * 减去指定向量
         * @param v 减去的向量
         * @returns 返回自身
         */
        sub(v: Vector4)
        {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            this.w -= v.w;

            return this;
        }

        /**
         * 减去指定向量
         * @param v 减去的向量
         * @returns 返回新向量
         */
        subTo(v: Vector4, vout = new Vector4())
        {
            return vout.copy(this).sub(v);
        }

        /**
         * 乘以指定向量
         * @param v 乘以的向量
         * @returns 返回自身
         */
        multiply(v: Vector4)
        {
            this.x *= v.x;
            this.y *= v.y;
            this.z *= v.z;
            this.w *= v.w;

            return this;
        }

        /**
         * 乘以指定向量
         * @param v 乘以的向量
         * @returns 返回新向量
         */
        multiplyTo(v: Vector4, vout = new Vector4())
        {
            return vout.copy(this).multiply(v);
        }

        /**
         * 除以指定向量
         * @param v 除以的向量
         * @returns 返回自身
         */
        div(v: Vector4)
        {
            this.x /= v.x;
            this.y /= v.y;
            this.z /= v.z;
            this.w /= v.w;

            return this;
        }

        /**
         * 除以指定向量
         * @param v 除以的向量
         * @returns 返回新向量
         */
        divTo(v: Vector4, vout = new Vector4())
        {
            return vout.copy(this).div(v);
        }

        /**
         * 与指定向量比较是否相等
         * @param v 比较的向量
         * @param precision 允许误差
         * @returns 相等返回true，否则false
         */
        equals(v: Vector4, precision = mathUtil.PRECISION)
        {
            if (!mathUtil.equals(this.x - v.x, 0, precision))
            { return false; }
            if (!mathUtil.equals(this.y - v.y, 0, precision))
            { return false; }
            if (!mathUtil.equals(this.z - v.z, 0, precision))
            { return false; }
            if (!mathUtil.equals(this.w - v.w, 0, precision))
            { return false; }

            return true;
        }

        /**
         * 负向量
         * @returns 返回自身
         */
        negate()
        {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;
            this.w = -this.w;

            return this;
        }

        /**
         * 负向量
         * @returns 返回新向量
         */
        negateTo(vout = new Vector4())
        {
            return vout.copy(this).negate();
        }

        /**
         * 缩放指定系数
         * @param s 缩放系数
         * @returns 返回自身
         */
        scale(s: number)
        {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            this.w *= s;

            return this;
        }

        /**
         * 缩放指定系数
         * @param s 缩放系数
         * @returns 返回新向量
         */
        scaleTo(s: number)
        {
            return this.clone().scale(s);
        }

        /**
         * 如果当前 Vector4 对象和作为参数指定的 Vector4 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        dot(a: Vector4)
        {
            return (this.x * a.x) + (this.y * a.y) + (this.z * a.z) + (this.w * a.w);
        }

        /**
         * 获取到指定向量的插值
         * @param v 终点插值向量
         * @param alpha 插值系数
         * @returns 返回自身
         */
        lerp(v: Vector4, alpha: number)
        {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;
            this.z += (v.z - this.z) * alpha;
            this.w += (v.w - this.w) * alpha;

            return this;
        }

        /**
         * 获取到指定向量的插值
         * @param v 终点插值向量
         * @param alpha 插值系数
         * @returns 返回新向量
         */
        lerpTo(v: Vector4, alpha: number, vout = new Vector4())
        {
            return vout.copy(this).lerp(v, alpha);
        }

        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        applyMatrix4x4(mat: Matrix4x4)
        {
            mat.transformVector4(this, this);

            return this;
        }

        /**
         * 返回当前 Vector4 对象的字符串表示形式。
         */
        toString(): string
        {
            return `<${this.x}, ${this.y}, ${this.z}, ${this.w}>`;
        }

        // Linearly interpolates between two vectors.
        static Lerp(a: Vector4, b: Vector4, t: number)
        {
            t = Mathf.Clamp01(t);

            return new Vector4(
                a.x + (b.x - a.x) * t,
                a.y + (b.y - a.y) * t,
                a.z + (b.z - a.z) * t,
                a.w + (b.w - a.w) * t
            );
        }

        // Linearly interpolates between two vectors without clamping the interpolant
        static LerpUnclamped(a: Vector4, b: Vector4, t: number)
        {
            return new Vector4(
                a.x + (b.x - a.x) * t,
                a.y + (b.y - a.y) * t,
                a.z + (b.z - a.z) * t,
                a.w + (b.w - a.w) * t
            );
        }

        // Moves a point /current/ towards /target/.
        static MoveTowards(current: Vector4, target: Vector4, maxDistanceDelta: number)
        {
            const toVectorX = target.x - current.x;
            const toVectorY = target.y - current.y;
            const toVectorZ = target.z - current.z;
            const toVectorW = target.w - current.w;

            const sqdist = (toVectorX * toVectorX + toVectorY * toVectorY + toVectorZ * toVectorZ + toVectorW * toVectorW);

            if (sqdist === 0 || (maxDistanceDelta >= 0 && sqdist <= maxDistanceDelta * maxDistanceDelta))
            {
                return target;
            }

            const dist = Math.sqrt(sqdist);

            return new Vector4(current.x + toVectorX / dist * maxDistanceDelta,
                current.y + toVectorY / dist * maxDistanceDelta,
                current.z + toVectorZ / dist * maxDistanceDelta,
                current.w + toVectorW / dist * maxDistanceDelta);
        }

        // Multiplies two vectors component-wise.
        static Scale(a: Vector4, b: Vector4)
        {
            return new Vector4(a.x * b.x, a.y * b.y, a.z * b.z, a.w * b.w);
        }

        // Multiplies every component of this vector by the same component of /scale/.
        Scale(scale: Vector4)
        {
            this.x *= scale.x;
            this.y *= scale.y;
            this.z *= scale.z;
            this.w *= scale.w;
        }

        // also required for being able to use Vector4s as keys in hash tables
        Equals(other: Vector4)
        {
            return this.x === other.x && this.y === other.y && this.z === other.z && this.w === other.w;
        }

        // *undoc* --- we have normalized property now
        static Normalize(a: Vector4)
        {
            const mag = Vector4.Magnitude(a);
            if (mag > Vector4.kEpsilon)
            {
                return new Vector4(a.x / mag, a.y / mag, a.z / mag, a.w / mag);
            }

            return Vector4.zero.clone();
        }

        // Makes this vector have a ::ref::magnitude of 1.
        Normalize()
        {
            const mag = Vector4.Magnitude(this);
            if (mag > Vector4.kEpsilon)
            {
                this.x = this.x / mag;
                this.y = this.y / mag;
                this.z = this.z / mag;
            }
            else
            {
                this.x = 0;
                this.y = 0;
                this.z = 0;
            }
        }

        // Returns this vector with a ::ref::magnitude of 1 (RO).
        get normalized()
        {
            return Vector4.Normalize(this);
        }

        // Dot Product of two vectors.
        static Dot(a: Vector4, b: Vector4)
        {
            return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
        }

        // Projects a vector onto another vector.
        static Project(a: Vector4, b: Vector4)
        {
            const scale = (Vector4.Dot(a, b) / Vector4.Dot(b, b));

            return new Vector4(b.x * scale, b.y * scale, b.z * scale, b.w * scale);
        }

        // Returns the distance between /a/ and /b/.
        static Distance(a: Vector4, b: Vector4)
        {
            return Vector4.Magnitude(a.clone().sub(b));
        }

        // *undoc* --- there's a property now
        static Magnitude(a: Vector4)
        {
            return Math.sqrt(Vector4.Dot(a, a));
        }

        // Returns the length of this vector (RO).
        get magnitude()
        {
            return Math.sqrt(Vector4.Dot(this, this));
        }

        // Returns the squared length of this vector (RO).
        get sqrMagnitude()
        {
            return Vector4.Dot(this, this);
        }

        // Returns a vector that is made from the smallest components of two vectors.
        static Min(lhs: Vector4, rhs: Vector4)
        {
            return new Vector4(Mathf.Min(lhs.x, rhs.x), Mathf.Min(lhs.y, rhs.y), Mathf.Min(lhs.z, rhs.z), Mathf.Min(lhs.w, rhs.w));
        }

        // Returns a vector that is made from the largest components of two vectors.
        public static Max(lhs: Vector4, rhs: Vector4)
        {
            return new Vector4(Mathf.Max(lhs.x, rhs.x), Mathf.Max(lhs.y, rhs.y), Mathf.Max(lhs.z, rhs.z), Mathf.Max(lhs.w, rhs.w));
        }

        // Shorthand for writing @@Vector4(0,0,0,0)@@
        static readonly zero = Object.freeze(new Vector4(0, 0, 0, 0));
        // Shorthand for writing @@Vector4(1,1,1,1)@@
        static readonly one = Object.freeze(new Vector4(1, 1, 1, 1));
        // Shorthand for writing @@Vector3(float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity)@@
        static readonly positiveInfinity = Object.freeze(new Vector4(Infinity, Infinity, Infinity, Infinity));
        // Shorthand for writing @@Vector3(float.NegativeInfinity, float.NegativeInfinity, float.NegativeInfinity)@@
        static readonly negativeInfinity = Object.freeze(new Vector4(-Infinity, -Infinity, -Infinity, -Infinity));

        // *undocumented*
        static readonly kEpsilon = 0.00001;
    }
}