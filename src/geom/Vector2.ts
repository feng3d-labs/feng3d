namespace feng3d
{

    var DEG_TO_RAD = Math.PI / 180;

    /**
     * Point 对象表示二维坐标系统中的某个位置，其中 x 表示水平轴，y 表示垂直轴。
     */
    export class Vector2
    {
        /**
         * 原点
         */
        static ZERO = new Vector2();

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
         * 创建一个 egret.Point 对象.若不传入任何参数，将会创建一个位于（0，0）位置的点。
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
         * 将 Point 的成员设置为指定值
         * @param x 该对象的x属性值
         * @param y 该对象的y属性值
         */
        init(x: number, y: number): Vector2
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
         * 确定两个点是否相同。如果两个点具有相同的 x 和 y 值，则它们是相同的点。
         * @param toCompare 要比较的点。
         * @returns 如果该对象与此 Point 对象相同，则为 true 值，如果不相同，则为 false。
         */
        equals(toCompare: Vector2)
        {
            return this.x == toCompare.x && this.y == toCompare.y;
        }

        /**
         * 返回 pt1 和 pt2 之间的距离。
         * @param p1 第一个点
         * @param p2 第二个点
         * @returns 第一个点和第二个点之间的距离。
         */
        static distance(p1: Vector2, p2: Vector2)
        {
            return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
        }

        /**
         * 将源 Point 对象中的所有点数据复制到调用方 Point 对象中。
         * @param sourcePoint 要从中复制数据的 Point 对象。
         */
        copy(sourcePoint: Vector2)
        {
            this.x = sourcePoint.x;
            this.y = sourcePoint.y;
            return this;
        }

        /**
         * 将另一个点的坐标添加到此点的坐标以创建一个新点。
         * @param v 要添加的点。
         * @returns 新点。
         */
        addTo(v: Vector2, vout = new Vector2())
        {
            return vout.init(this.x + v.x, this.y + v.y);
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
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        scale(s: number): Vector2
        {
            this.x *= s;
            this.y *= s;
            return this;
        }

        /**
         * 按指定量偏移 Point 对象。dx 的值将添加到 x 的原始值中以创建新的 x 值。dy 的值将添加到 y 的原始值中以创建新的 y 值。
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
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @returns 新点。
         */
        subTo(v: Vector2, vout = new Vector2()): Vector2
        {
            return vout.init(this.x - v.x, this.y - v.y);
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
         * 返回包含 x 和 y 坐标的值的字符串。该字符串的格式为 "(x=x, y=y)"，因此为点 23,17 调用 toString() 方法将返回 "(x=23, y=17)"。
         * @returns 坐标的字符串表示形式。
         */
        toString(): string
        {
            return "(x=" + this.x + ", y=" + this.y + ")";
        }

        /**
         * 返回包含 x 和 y 坐标值的数组
         */
        toArray()
        {
            return [this.x, this.y];
        }
    }
}