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
            alert("未实现" + "Matrix3D.determinant");
            return 0;
        }

        /**
         * 通过将另一个 Matrix3D 对象与当前 Matrix3D 对象相乘来后置一个矩阵。
         */
        public append(lhs: Matrix3D) {
            alert("未实现" + "Matrix3D.append");
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
            alert("未实现" + "Matrix3D.appendTranslation");
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
            alert("未实现" + "Matrix3D.copyColumnFrom");
        }

        /**
         * 将调用方 Matrix3D 对象的特定列复制到 Vector3D 对象中。
         */
        public copyColumnTo(col: number, vector3D: Vector3D) {
            alert("未实现" + "Matrix3D.copyFrom");
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
            alert("未实现" + "Matrix3D.copyRawDataFrom");
        }

        /**
         * 将调用方 Matrix3D 对象中的所有矩阵数据复制到提供的矢量中。
         */
        public copyRawDataTo(vector: Array<number>, index: number = 0, transpose: boolean = false) {

            alert("未实现" + "Matrix3D.copyRawDataTo");
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