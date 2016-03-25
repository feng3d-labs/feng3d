module feng3d {

    /**
     * Matrix3D 类表示一个转换矩阵，该矩阵确定三维 (3D) 显示对象的位置和方向。
     * 该矩阵可以执行转换功能，包括平移（沿 x、y 和 z 轴重新定位）、旋转和缩放（调整大小）。
     * Matrix3D 类还可以执行透视投影，这会将 3D 坐标空间中的点映射到二维 (2D) 视图。
     */
    export class Matrix3D {

        /**
         * 一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        public rawData: Array<number>;

        /**
         * 创建 Matrix3D 对象。
         */
        constructor(datas: Array<number> = null) {
            if (datas) {
                this.rawData = datas;
            }
            else
                this.rawData = [//
                    1, 0, 0, 0,// 
                    0, 1, 0, 0,// 
                    0, 0, 1, 0,//
                    0, 0, 0, 1//
                ];
        }

        /**
         * 一个保存显示对象在转换参照帧中的 3D 坐标 (x,y,z) 位置的 Vector3D 对象。
         */
        public get position(): Vector3D {
            return new Vector3D(this.rawData[12], this.rawData[13], this.rawData[14]);
        }

        public set position(value: Vector3D) {
            this.rawData[12] = value.x;
            this.rawData[13] = value.y;
            this.rawData[14] = value.z;
        }

        /**
         * 一个用于确定矩阵是否可逆的数字。
         */
        public get determinant(): number {

            return ((this.rawData[0] * this.rawData[5] - this.rawData[4] * this.rawData[1]) * (this.rawData[10] * this.rawData[15] - this.rawData[14] * this.rawData[11]) - (this.rawData[0] * this.rawData[9] - this.rawData[8] * this.rawData[1]) * (this.rawData[6] * this.rawData[15] - this.rawData[14] * this.rawData[7]) + (this.rawData[0] * this.rawData[13] - this.rawData[12] * this.rawData[1]) * (this.rawData[6] * this.rawData[11] - this.rawData[10] * this.rawData[7]) + (this.rawData[4] * this.rawData[9] - this.rawData[8] * this.rawData[5]) * (this.rawData[2] * this.rawData[15] - this.rawData[14] * this.rawData[3]) - (this.rawData[4] * this.rawData[13] - this.rawData[12] * this.rawData[5]) * (this.rawData[2] * this.rawData[11] - this.rawData[10] * this.rawData[3]) + (this.rawData[8] * this.rawData[13] - this.rawData[12] * this.rawData[9]) * (this.rawData[2] * this.rawData[7] - this.rawData[6] * this.rawData[3]));

        }

        /**
         * 通过将另一个 Matrix3D 对象与当前 Matrix3D 对象相乘来后置一个矩阵。
         */
        public append(lhs: Matrix3D) {
            var m111: number = this.rawData[0], m121: number = this.rawData[4], m131: number = this.rawData[8], m141: number = this.rawData[12], m112: number = this.rawData[1], m122: number = this.rawData[5], m132: number = this.rawData[9], m142: number = this.rawData[13], m113: number = this.rawData[2], m123: number = this.rawData[6], m133: number = this.rawData[10], m143: number = this.rawData[14], m114: number = this.rawData[3], m124: number = this.rawData[7], m134: number = this.rawData[11], m144: number = this.rawData[15], m211: number = lhs.rawData[0], m221: number = lhs.rawData[4], m231: number = lhs.rawData[8], m241: number = lhs.rawData[12], m212: number = lhs.rawData[1], m222: number = lhs.rawData[5], m232: number = lhs.rawData[9], m242: number = lhs.rawData[13], m213: number = lhs.rawData[2], m223: number = lhs.rawData[6], m233: number = lhs.rawData[10], m243: number = lhs.rawData[14], m214: number = lhs.rawData[3], m224: number = lhs.rawData[7], m234: number = lhs.rawData[11], m244: number = lhs.rawData[15];

            this.rawData[0] = m111 * m211 + m112 * m221 + m113 * m231 + m114 * m241;
            this.rawData[1] = m111 * m212 + m112 * m222 + m113 * m232 + m114 * m242;
            this.rawData[2] = m111 * m213 + m112 * m223 + m113 * m233 + m114 * m243;
            this.rawData[3] = m111 * m214 + m112 * m224 + m113 * m234 + m114 * m244;

            this.rawData[4] = m121 * m211 + m122 * m221 + m123 * m231 + m124 * m241;
            this.rawData[5] = m121 * m212 + m122 * m222 + m123 * m232 + m124 * m242;
            this.rawData[6] = m121 * m213 + m122 * m223 + m123 * m233 + m124 * m243;
            this.rawData[7] = m121 * m214 + m122 * m224 + m123 * m234 + m124 * m244;

            this.rawData[8] = m131 * m211 + m132 * m221 + m133 * m231 + m134 * m241;
            this.rawData[9] = m131 * m212 + m132 * m222 + m133 * m232 + m134 * m242;
            this.rawData[10] = m131 * m213 + m132 * m223 + m133 * m233 + m134 * m243;
            this.rawData[11] = m131 * m214 + m132 * m224 + m133 * m234 + m134 * m244;

            this.rawData[12] = m141 * m211 + m142 * m221 + m143 * m231 + m144 * m241;
            this.rawData[13] = m141 * m212 + m142 * m222 + m143 * m232 + m144 * m242;
            this.rawData[14] = m141 * m213 + m142 * m223 + m143 * m233 + m144 * m243;
            this.rawData[15] = m141 * m214 + m142 * m224 + m143 * m234 + m144 * m244;
        }

        /**
         * 在 Matrix3D 对象上后置一个增量缩放，沿 x、y 和 z 轴改变位置。
         */
        public appendScale(xScale: number, yScale: number, zScale: number) {
            alert("未实现" + "Matrix3D.appendScale");
        }

        /**
         * 在 Matrix3D 对象上后置一个增量平移，沿 x、y 和 z 轴重新定位。
         */
        public appendTranslation(x: number, y: number, z: number) {
            this.rawData[12] += x;
            this.rawData[13] += y;
            this.rawData[14] += z;
        }

        /**
         * 返回一个新 Matrix3D 对象，它是与当前 Matrix3D 对象完全相同的副本。
         */
        public clone(): Matrix3D {
            var ret: Matrix3D = new Matrix3D();
            ret.copyFrom(this);
            return ret;
        }

        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定列中。
         */
        public copyColumnFrom(column: number, vector3D: Vector3D) {
            this.rawData[column * 4 + 0] = vector3D.x;
            this.rawData[column * 4 + 1] = vector3D.y;
            this.rawData[column * 4 + 2] = vector3D.z;
            this.rawData[column * 4 + 3] = vector3D.w;
        }

        /**
         * 将调用方 Matrix3D 对象的特定列复制到 Vector3D 对象中。
         */
        public copyColumnTo(column: number, vector3D: Vector3D) {
            vector3D.x = this.rawData[column * 4 + 0];
            vector3D.y = this.rawData[column * 4 + 1];
            vector3D.z = this.rawData[column * 4 + 2];
            vector3D.w = this.rawData[column * 4 + 3];
        }

        /**
         * 将源 Matrix3D 对象中的所有矩阵数据复制到调用方 Matrix3D 对象中。
         */
        public copyFrom(sourceMatrix3D: Matrix3D): void {
            for (var i = 0; i < 16; i++) {
                this.rawData[i] = sourceMatrix3D.rawData[i];
            }
        }

        /**
         * @param transpose 是否转置当前矩阵.
         */
        public copyRawDataFrom(vector: Array<number>, index: number = 0, transpose: boolean = false): void {
            if (vector.length - index < 16) {
                throw new ArgumentError();
            }
            for (var i = 0; i < 16; i++) {
                this.rawData[i] = vector[index + i];
            }
            if(transpose){
                this.transpose();
            }
        }

        /**
         * 将调用方 Matrix3D 对象中的所有矩阵数据复制到提供的矢量中。
         */
        public copyRawDataTo(vector: Array<number>, index: number = 0, transpose: boolean = false) {
            if(transpose){
                this.transpose();
            }
            for (var i = 0; i < 16; i++) {
                vector[i+index] = this.rawData[i];
            }
            if(transpose){
                this.transpose();
            }
        }

        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定行中。
         */
        public copyRowFrom(column: number, vector3D: Vector3D) {

            alert("未实现" + "Matrix3D.copyRowFrom");
        }

        /**
         * 将调用方 Matrix3D 对象的特定行复制到 Vector3D 对象中。
         */
        public copyRowTo(column: number, vector3D: Vector3D) {

            alert("未实现" + "Matrix3D.copyRowTo");
        }

        /**
         * 拷贝当前矩阵
         */
        public copyToMatrix3D(dest: Matrix3D) {
            dest.rawData = this.rawData.slice(0);
        }

        /**
         * 将转换矩阵的平移、旋转和缩放设置作为由三个 Vector3D 对象组成的矢量返回。
         */
        public decompose(orientationStyle: string = "eulerAngles"): Vector3D[] {
            alert("未实现" + "Matrix3D.decompose");
            return null;
        }

        /**
         * 使用不含平移元素的转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         */
        public deltaTransformVector(v: Vector3D): Vector3D {

            alert("未实现" + "Matrix3D.invert");
            return null;
        }

        /**
         * 将当前矩阵转换为恒等或单位矩阵。
         */
        public identity() {
            this.rawData[1] = 0;
            this.rawData[2] = 0;
            this.rawData[3] = 0;
            this.rawData[4] = 0;
            this.rawData[6] = 0;
            this.rawData[7] = 0;
            this.rawData[8] = 0;
            this.rawData[9] = 0;
            this.rawData[11] = 0;
            this.rawData[12] = 0;
            this.rawData[13] = 0;
            this.rawData[14] = 0;

            this.rawData[0] = 1;
            this.rawData[5] = 1;
            this.rawData[10] = 1;
            this.rawData[15] = 1;

        }

        /**
         * 反转当前矩阵。
         */
        public invert(): boolean {
            alert("未实现" + "Matrix3D.invert");
            return false;
        }

        /**
         * 通过平移、旋转和缩放设置矩阵。
         */
        public recompose(components: Vector3D[]): boolean {

            alert("未实现" + "Matrix3D.recompose");
            return true;
        }

        /**
         * 使用转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         */
        public transformVector(v: Vector3D): Vector3D {
            alert("未实现" + "Matrix3D.transformVector");
            return null;
        }

        /**
         * 将当前 Matrix3D 对象转换为一个矩阵，并将互换其中的行和列。
         */
        public transpose() {
            var swap;
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    if (i > j) {
                        swap = this.rawData[i * 4 + j];
                        this.rawData[i * 4 + j] = this.rawData[j * 4 + i];
                        this.rawData[j * 4 + i] = swap;
                    }
                }
            }
        }

        /**
         * 以字符串返回矩阵的值
         */
        public toString(): string {
            var str = "";
            var showLen = 5;
            var precision = Math.pow(10, showLen - 1);

            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    str += StringUtils.getString(Math.round(this.rawData[i * 4 + j] * precision) / precision, showLen, " ");
                }
                if (i != 3)
                    str += "\n";
            }
            return str;
        }

    }
}