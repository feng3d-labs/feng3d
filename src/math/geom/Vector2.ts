namespace feng3d
{

    var DEG_TO_RAD = Math.PI / 180;

    /**
     * Vector2 对象表示二维坐标系统中的某个位置，其中 x 表示水平轴，y 表示垂直轴。
     */
    export class Vector2 implements Vector
    {
        __class__: "feng3d.Vector2";

        /**
         * 原点
         */
        static ZERO = Object.freeze(new Vector2());

        /**
         * 将一对极坐标转换为笛卡尔点坐标。
         * @param len 极坐标对的长度。
         * @param angle 极坐标对的角度（以弧度表示）。
         */
        static polar(len: number, angle: number): Vector2
        {
            return new Vector2(len * Math.cos(angle / DEG_TO_RAD), len * Math.sin(angle / DEG_TO_RAD));
        }

        /**
         * 创建一个 Vector2 对象.若不传入任何参数，将会创建一个位于（0，0）位置的点。
         * 
         * @param x 该对象的x属性值，默认为0
         * @param y 该对象的y属性值，默认为0
         */
        constructor(x = 0, y = 0)
        {
            this.x = x;
            this.y = y;
        }

        /**
         * 该点的水平坐标。
         * @default 0
         */
        @oav()
        @serialize
        x: number;

        /**
         * 该点的垂直坐标。
         * @default 0
         */
        @oav()
        @serialize
        y: number;

        /**
         * 从 (0,0) 到此点的线段长度。
         */
        get length(): number
        {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        /**
         * 将 Vector2 的成员设置为指定值
         * @param x 该对象的x属性值
         * @param y 该对象的y属性值
         */
        set(x = 0, y = x): Vector2
        {
            this.x = x;
            this.y = y;
            return this;
        }

        /**
         * 克隆点对象
         */
        clone(): Vector2
        {
            return new Vector2(this.x, this.y);
        }

        /**
         * 返回 pt1 和 pt2 之间的距离。
         * @param p1 第一个点
         * @param p2 第二个点
         * @returns 第一个点和第二个点之间的距离。
         */
        static distance(p1: Vector2, p2: Vector2)
        {
            return p1.distance(p2);
        }

        /**
         * 将另一个点的坐标添加到此点的坐标。
         * @param v 要添加的点。
         */
        add(v: Vector2): Vector2
        {
            this.x += v.x;
            this.y += v.y;
            return this;
        }

        /**
         * 将另一个点的坐标添加到此点的坐标以创建一个新点。
         * @param v 要添加的点。
         * @returns 新点。
         */
        addTo(v: Vector2, vout = new Vector2())
        {
            vout.x = this.x + v.x;
            vout.y = this.y + v.y;
            return vout;
        }

        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @returns 新点。
         */
        sub(v: Vector2)
        {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        }

        /**
         * 减去向量返回新向量
         * @param v 减去的向量
         * @return 返回的新向量
         */
        subTo(v: Vector2, vout = new Vector2())
        {
            vout.x = this.x - v.x;
            vout.y = this.y - v.y;
            return vout;
        }

        /**
         * 乘以向量
         * @param v 向量
         */
        multiply(v: Vector2)
        {
            this.x *= v.x;
            this.y *= v.y;
            return this;
        }

        /**
         * 乘以向量
         * @param v 向量
         * @param vout 输出向量
         */
        multiplyTo(v: Vector2, vout = new Vector2())
        {
            vout.x = this.x * v.x;
            vout.y = this.y * v.y;
            return vout;
        }

        /**
         * 除以向量
         * @param v 向量
         */
        divide(v: Vector2)
        {
            this.x /= v.x;
            this.y /= v.y;
            return this;
        }

        /**
         * 除以向量
         * @param v 向量
         * @param vout 输出向量 
         */
        divideTo(v: Vector2, vout = new Vector2())
        {
            vout.x = this.x / v.x;
            vout.y = this.y / v.y;
            return vout;
        }

        /**
         * 确定两个点是否相同。如果两个点具有相同的 x 和 y 值，则它们是相同的点。
         * @param toCompare 要比较的向量。
         * @returns 如果该对象与此 向量 对象相同，则为 true 值，如果不相同，则为 false。
         */
        equals(v: Vector2, precision = Math.PRECISION)
        {
            if (!Math.equals(this.x - v.x, 0, precision))
                return false;
            if (!Math.equals(this.y - v.y, 0, precision))
                return false;
            return true;
        }

        /**
         * 将源 Vector2 对象中的所有点数据复制到调用方 Vector2 对象中。
         * @param source 要从中复制数据的 Vector2 对象。
         */
        copy(source: Vector2)
        {
            this.x = source.x;
            this.y = source.y;
            return this;
        }

        /**
         * 返回与目标点之间的距离。
         * @param p 目标点
         * @returns 与目标点之间的距离。
         */
        distance(p: Vector2)
        {
            var dx = this.x - p.x, dy = this.y - p.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        /**
         * 与目标点之间的距离平方
         * @param p 目标点
         */
        distanceSquared(p: Vector3)
        {
            var dx = this.x - p.x, dy = this.y - p.y;
            return dx * dx + dy * dy;
        }

        /**
         * 将 (0,0) 和当前点之间的线段缩放为设定的长度。
         * @param thickness 缩放值。例如，如果当前点为 (0,5) 并且您将它规范化为 1，则返回的点位于 (0,1) 处。
         */
        normalize(thickness = 1)
        {
            if (this.x != 0 || this.y != 0)
            {
                let relativeThickness = thickness / this.length;
                this.x *= relativeThickness;
                this.y *= relativeThickness;
            }
            return this;
        }

        /**
         * 负向量
         */
        negate()
        {
            this.x *= -1;
            this.y *= -1;
            return this;
        }

        /**
         * 倒数向量。
         * (x,y) -> (1/x,1/y)
         */
        reciprocal()
        {
            this.x = 1 / this.x;
            this.y = 1 / this.y;
            return this;
        }

        /**
         * 倒数向量。
         * (x,y) -> (1/x,1/y)
         */
        reciprocalTo(out = new Vector2())
        {
            out.copy(this).reciprocal();
            return out;
        }

        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        scaleNumber(s: number): Vector2
        {
            this.x *= s;
            this.y *= s;
            return this;
        }
        /**
         * 按标量（大小）缩放当前的 Vector2 对象。
         */
        scaleNumberTo(s: number, vout = new Vector2())
        {
            return vout.copy(this).scaleNumber(s);
        }

        /**
         * 缩放
         * @param s 缩放量
         */
        scale(s: Vector2)
        {
            this.x *= s.x;
            this.y *= s.y;
            return this;
        }

        /**
         * 缩放
         * @param s 缩放量
         */
        scaleTo(s: Vector2, vout = new Vector2())
        {
            if (s == vout) s = s.clone();
            return vout.copy(this).scale(s);
        }

        /**
         * 按指定量偏移 Vector2 对象。dx 的值将添加到 x 的原始值中以创建新的 x 值。dy 的值将添加到 y 的原始值中以创建新的 y 值。
         * @param dx 水平坐标 x 的偏移量。
         * @param dy 水平坐标 y 的偏移量。
         */
        offset(dx: number, dy: number): Vector2
        {
            this.x += dx;
            this.y += dy;
            return this;
        }



        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerp(p: Vector2, alpha: Vector2): Vector2
        {
            this.x += (p.x - this.x) * alpha.x;
            this.y += (p.y - this.y) * alpha.y;
            return this;
        }

        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回新向量
         */
        lerpTo(v: Vector2, alpha: Vector2, vout = new Vector2())
        {
            return vout.copy(this).lerp(v, alpha);
        }

        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerpNumber(v: Vector2, alpha: number)
        {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;
            return this;
        }

        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerpNumberTo(v: Vector2, alpha: number, vout = new Vector2())
        {
            return vout.copy(this).lerpNumber(v, alpha);
        }


        /**
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        clamp(min: Vector2, max: Vector2)
        {
            this.x = Math.clamp(this.x, min.x, max.x);
            this.y = Math.clamp(this.y, min.y, max.y);
            return this;
        }

        /**
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        clampTo(min: Vector2, max: Vector2, vout = new Vector2())
        {
            return vout.copy(this).clamp(min, max);
        }

        /**
         * 取最小元素
         * @param v 向量
         */
        min(v: Vector2)
        {
            this.x = Math.min(this.x, v.x);
            this.y = Math.min(this.y, v.y);
            return this;
        }

        /**
         * 取最大元素
         * @param v 向量
         */
        max(v: Vector2)
        {
            this.x = Math.max(this.x, v.x);
            this.y = Math.max(this.y, v.y);
            return this;
        }

        /**
         * 各分量均取最近的整数
         */
        round()
        {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            return this;
        }

        /**
         * 返回包含 x 和 y 坐标的值的字符串。该字符串的格式为 "(x=x, y=y)"，因此为点 23,17 调用 toString() 方法将返回 "(x=23, y=17)"。
         * @returns 坐标的字符串表示形式。
         */
        toString(): string
        {
            return "(x=" + this.x + ", y=" + this.y + ")";
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
            return array;
        }
    }
}