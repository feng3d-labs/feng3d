module me.feng3d {
    /**
     * Vector3D 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置
     * @author feng 2016-3-21
     */
    export class Vector3D {

        /**
        * 定义为 Vector3D 对象的 x 轴，坐标为 (1,0,0)。
        */
        public static X_AXIS: Vector3D = new Vector3D(1, 0, 0);

        /**
        * 定义为 Vector3D 对象的 y 轴，坐标为 (0,1,0)
        */
        public static Y_AXIS: Vector3D = new Vector3D(0, 1, 0);

        /**
        * 定义为 Vector3D 对象的 z 轴，坐标为 (0,0,1)
        */
        public static Z_AXIS: Vector3D = new Vector3D(0, 0, 1);

        /**
        * Vector3D 对象中的第一个元素，例如，三维空间中某个点的 x 坐标。默认值为 0
        */
        public x: number;

        /**
        * Vector3D 对象中的第二个元素，例如，三维空间中某个点的 y 坐标。默认值为 0
        */
        public y: number;

        /**
        * Vector3D 对象中的第三个元素，例如，三维空间中某个点的 z 坐标。默认值为 0
        */
        public z: number;

        /**
        * Vector3D 对象的第四个元素（除了 x、y 和 z 属性之外）可以容纳数据，例如旋转角度。默认值为 0
        */
        public w: number;

        /**
        * 当前 Vector3D 对象的长度（大小），即从原点 (0,0,0) 到该对象的 x、y 和 z 坐标的距离。w 属性将被忽略。单位矢量具有的长度或大小为一。
        */
        public get length(): number {
            return Math.sqrt(this.lengthSquared);
        }

        /**
        * 当前 Vector3D 对象长度的平方，它是使用 x、y 和 z 属性计算出来的。w 属性将被忽略。尽可能使用 lengthSquared() 方法，而不要使用 Vector3D.length() 方法的 Math.sqrt() 方法调用，后者速度较慢。
        */
        public get lengthSquared(): number {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        }

        /**
         * 创建 Vector3D 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector3D 对象。
         * @param x 第一个元素，例如 x 坐标。
         * @param y 第二个元素，例如 y 坐标。
         * @param z 第三个元素，例如 z 坐标。
         * @param w 表示额外数据的可选元素，例如旋转角度
         */
        constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }

        /**
         * 将当前 Vector3D 对象的 x、y 和 z 元素的值与另一个 Vector3D 对象的 x、y 和 z 元素的值相加。
         * @param a 要与当前 Vector3D 对象相加的 Vector3D 对象。
         * @return 一个 Vector3D 对象，它是将当前 Vector3D 对象与另一个 Vector3D 对象相加所产生的结果。
         */
        public add(a: Vector3D): Vector3D {
            return new Vector3D(this.x + a.x, this.y + a.y, this.z + a.z, this.w + a.w)
        }

        /**
         * 返回一个新 Vector3D 对象，它是与当前 Vector3D 对象完全相同的副本。
         * @return 一个新 Vector3D 对象，它是当前 Vector3D 对象的副本。
         */
        public clone(): Vector3D {
            return new Vector3D(this.x, this.y, this.z, this.w);
        }

        /**
         * 将源 Vector3D 对象中的所有矢量数据复制到调用方 Vector3D 对象中。
         * @return 要从中复制数据的 Vector3D 对象。
         */
        public copyFrom(sourceVector3D: Vector3D) {
            this.x = sourceVector3D.x;
            this.y = sourceVector3D.y;
            this.z = sourceVector3D.z;
            this.w = sourceVector3D.w;
        }

        /**
         * 返回一个新的 Vector3D 对象，它与当前 Vector3D 对象和另一个 Vector3D 对象垂直（成直角）。
         */
        public crossProduct(a: Vector3D): Vector3D {
            return new Vector3D(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x, 1);
        }

        /**
         * 按照指定的 Vector3D 对象的 x、y 和 z 元素的值递减当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        public decrementBy(a: Vector3D) {
            this.x -= a.x;
            this.y -= a.y;
            this.z -= a.z;
        }

        /**
         * 返回两个 Vector3D 对象之间的距离。
         */
        static distance(pt1: Vector3D, pt2: Vector3D): number {
            var x: number = (pt1.x - pt2.x);
            var y: number = (pt1.y - pt2.y);
            var z: number = (pt1.z - pt2.z);
            return Math.sqrt(x * x + y * y + z * z);
        }

        /**
         * 如果当前 Vector3D 对象和作为参数指定的 Vector3D 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        public dotProduct(a: Vector3D): number {
            return this.x * a.x + this.y * a.y + this.z * a.z;
        }

        /**
         * 通过将当前 Vector3D 对象的 x、y 和 z 元素与指定的 Vector3D 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
         */
        public equals(toCompare: Vector3D, allFour: boolean = false): boolean {
            return (this.x == toCompare.x && this.y == toCompare.y && this.z == toCompare.z && (!allFour || this.w == toCompare.w));
        }

        /**
         * 按照指定的 Vector3D 对象的 x、y 和 z 元素的值递增当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        public incrementBy(a: Vector3D) {
            this.x += a.x;
            this.y += a.y;
            this.z += a.z;
        }

        /**
         * 将当前 Vector3D 对象设置为其逆对象。
         */
        public negate() {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;
        }

        /**
         * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3D 对象转换为单位矢量。
         */
        public normalize(thickness: number = 1) {
            if (this.length != 0) {
                var invLength = thickness / this.length;
                this.x *= invLength;
                this.y *= invLength;
                this.z *= invLength;
                return;
            }
        }

        /**
         * 按标量（大小）缩放当前的 Vector3D 对象。
         */
        public scaleBy(s: number) {
            this.x *= s;
            this.y *= s;
            this.z *= s;
        }

        /**
         * 将 Vector3D 的成员设置为指定值
         */
        public setTo(xa: number, ya: number, za: number) {
            this.x = xa;
            this.y = ya;
            this.z = za;
        }

        /**
         * 从另一个 Vector3D 对象的 x、y 和 z 元素的值中减去当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        public subtract(a: Vector3D): Vector3D {
            return new Vector3D(this.x - a.x, this.y - a.y, this.z - a.z);
        }

        /**
         * 返回当前 Vector3D 对象的字符串表示形式。
         */
        public toString(): string {
            return "<" + this.x + ", " + this.y + ", " + this.z + ">";
        }
    }
}