namespace feng3d
{
    /**
     * 四维向量
     */
    export class Vector4
    {
        __class__: "feng3d.Vector4";

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
            return new Vector4(Math.random(), Math.random(), Math.random(), Math.random())
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
            this.init(x, y, z, w);
        }

        /**
         * 初始化向量
         * @param x 第一个元素
         * @param y 第二个元素
         * @param z 第三个元素
         * @param w 第四个元素
         * @return 返回自身
         */
        init(x: number, y: number, z: number, w: number)
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
         * @return 返回自身
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
         * @return 返回自身
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
         * @return 返回新向量
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
         * @return 返回新向量
         */
        addTo(v: Vector4, vout = new Vector4())
        {
            return vout.copy(this).add(v);
        }

        /**
         * 克隆一个向量
         * @return 返回一个拷贝向量
         */
        clone()
        {
            return new Vector4(this.x, this.y, this.z, this.w);
        }

        /**
         * 从指定向量拷贝数据
         * @param v 被拷贝向量
         * @return 返回自身
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
         * @return 返回自身
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
         * @return 返回新向量
         */
        subTo(v: Vector4, vout = new Vector4())
        {
            return vout.copy(this).sub(v);
        }

        /**
         * 乘以指定向量
         * @param v 乘以的向量
         * @return 返回自身
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
         * @return 返回新向量
         */
        multiplyTo(v: Vector4, vout = new Vector4())
        {
            return vout.copy(this).multiply(v);
        }

        /**
         * 除以指定向量
         * @param v 除以的向量
         * @return 返回自身
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
         * @return 返回新向量
         */
        divTo(v: Vector4, vout = new Vector4())
        {
            return vout.copy(this).div(v);
        }

        /**
         * 与指定向量比较是否相等
         * @param v 比较的向量
         * @param precision 允许误差
         * @return 相等返回true，否则false
         */
        equals(v: Vector4, precision = Math.PRECISION)
        {
            if (!Math.equals(this.x - v.x, 0, precision))
                return false;
            if (!Math.equals(this.y - v.y, 0, precision))
                return false;
            if (!Math.equals(this.z - v.z, 0, precision))
                return false;
            if (!Math.equals(this.w - v.w, 0, precision))
                return false;
            return true;
        }

        /**
         * 负向量
         * @return 返回自身
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
         * @return 返回新向量
         */
        negateTo(vout = new Vector4())
        {
            return vout.copy(this).negate();
        }

        /**
         * 缩放指定系数
         * @param s 缩放系数
         * @return 返回自身
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
         * @return 返回新向量
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
            return this.x * a.x + this.y * a.y + this.z * a.z + this.w * a.w;
        }

        /**
         * 获取到指定向量的插值
         * @param v 终点插值向量
         * @param alpha 插值系数
         * @return 返回自身
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
         * @return 返回新向量
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
            return "<" + this.x + ", " + this.y + ", " + this.z + ", " + this.w + ">";
        }
    }
}