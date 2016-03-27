module feng3d {

    /**
     * Matrix3D 类表示一个转换矩阵，该矩阵确定三维 (3D) 显示对象的位置和方向。
     * 该矩阵可以执行转换功能，包括平移（沿 x、y 和 z 轴重新定位）、旋转和缩放（调整大小）。
     * Matrix3D 类还可以执行透视投影，这会将 3D 坐标空间中的点映射到二维 (2D) 视图。
     * 
     *  ---            方向              平移 ---
     *  |   scaleX      0         0       tx    |
     *  |     0       scaleY      0       ty    |
     *  |     0         0       scaleZ    tz    |
     *  |     0         0         0       tw    |
     *  ---  x轴        y轴      z轴          ---
     * 
     *  ---            方向              平移 ---
     *  |     0         4         8       12    |
     *  |     1         5         9       13    |
     *  |     2         6        10       14    |
     *  |     3         7        11       15    |
     *  ---  x轴        y轴      z轴          ---
     */
    export class Matrix3D {

        /**
         * 一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        public rawData: Array<number>;

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

            return (//
                (this.rawData[0] * this.rawData[5] - this.rawData[4] * this.rawData[1]) * (this.rawData[10] * this.rawData[15] - this.rawData[14] * this.rawData[11]) //
                - (this.rawData[0] * this.rawData[9] - this.rawData[8] * this.rawData[1]) * (this.rawData[6] * this.rawData[15] - this.rawData[14] * this.rawData[7]) //
                + (this.rawData[0] * this.rawData[13] - this.rawData[12] * this.rawData[1]) * (this.rawData[6] * this.rawData[11] - this.rawData[10] * this.rawData[7]) //
                + (this.rawData[4] * this.rawData[9] - this.rawData[8] * this.rawData[5]) * (this.rawData[2] * this.rawData[15] - this.rawData[14] * this.rawData[3]) //
                - (this.rawData[4] * this.rawData[13] - this.rawData[12] * this.rawData[5]) * (this.rawData[2] * this.rawData[11] - this.rawData[10] * this.rawData[3]) //
                + (this.rawData[8] * this.rawData[13] - this.rawData[12] * this.rawData[9]) * (this.rawData[2] * this.rawData[7] - this.rawData[6] * this.rawData[3])//
            );
        }

        /**
         * 创建 Matrix3D 对象。
         * @param   datas    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
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
         * 创建旋转矩阵
         * @param   degrees         角度
         * @param   axis            旋转轴
         * @param   pivotPoint      旋转中心点
         */
        public static createRotationMatrix3D(degrees: number, axis: Vector3D): Matrix3D {

            var n = axis.clone();
            n.normalize();
            var q = degrees * Math.PI / 180;

            var sinq = Math.sin(q);
            var cosq = Math.cos(q);
            var lcosq = 1 - cosq;

            var rotationMat: Matrix3D = new Matrix3D([//
                n.x * n.x * lcosq + cosq, n.x * n.y * lcosq + n.z * sinq, n.x * n.z * lcosq - n.y * sinq, 0,//
                n.x * n.y * lcosq - n.z * sinq, n.y * n.y * lcosq + cosq, n.y * n.z * lcosq + n.x * sinq, 0,//
                n.x * n.z * lcosq + n.y * sinq, n.y * n.z * lcosq - n.x * sinq, n.z * n.z * lcosq + cosq, 0,//
                0, 0, 0, 1//
            ]);
            return rotationMat;
        }

        /**
         * 创建缩放矩阵
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        public static createScaleMatrix3D(xScale: number, yScale: number, zScale: number): Matrix3D {

            var rotationMat: Matrix3D = new Matrix3D([//
                xScale, 0.0000, 0.0000, 0,//
                0.0000, yScale, 0.0000, 0,//
                0.0000, 0.0000, zScale, 0,//
                0.0000, 0.0000, 0.0000, 1//
            ]);
            return rotationMat;
        }

        /**
         * 通过将另一个 Matrix3D 对象与当前 Matrix3D 对象相乘来后置一个矩阵。
         */
        public append(lhs: Matrix3D) {
            var //
                m111: number = this.rawData[0], m121: number = this.rawData[4], m131: number = this.rawData[8], m141: number = this.rawData[12],//
                m112: number = this.rawData[1], m122: number = this.rawData[5], m132: number = this.rawData[9], m142: number = this.rawData[13],//
                m113: number = this.rawData[2], m123: number = this.rawData[6], m133: number = this.rawData[10], m143: number = this.rawData[14],//
                m114: number = this.rawData[3], m124: number = this.rawData[7], m134: number = this.rawData[11], m144: number = this.rawData[15], //

                m211: number = lhs.rawData[0], m221: number = lhs.rawData[4], m231: number = lhs.rawData[8], m241: number = lhs.rawData[12], //
                m212: number = lhs.rawData[1], m222: number = lhs.rawData[5], m232: number = lhs.rawData[9], m242: number = lhs.rawData[13], //
                m213: number = lhs.rawData[2], m223: number = lhs.rawData[6], m233: number = lhs.rawData[10], m243: number = lhs.rawData[14], //
                m214: number = lhs.rawData[3], m224: number = lhs.rawData[7], m234: number = lhs.rawData[11], m244: number = lhs.rawData[15];

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
         * 在 Matrix3D 对象上后置一个增量旋转。
         * @param   degrees         角度
         * @param   axis            旋转轴
         * @param   pivotPoint      旋转中心点
         */
        public appendRotation(degrees: number, axis: Vector3D, pivotPoint: Vector3D = null): void {

            var rotationMat = Matrix3D.createRotationMatrix3D(degrees, axis);

            if (pivotPoint != null) {
                this.appendTranslation(-pivotPoint.x, -pivotPoint.y, -pivotPoint.z)
            }

            this.append(rotationMat);

            if (pivotPoint != null) {
                this.appendTranslation(pivotPoint.x, pivotPoint.y, pivotPoint.z)
            }
        }

        /**
         * 在 Matrix3D 对象上后置一个增量缩放，沿 x、y 和 z 轴改变位置。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        public appendScale(xScale: number, yScale: number, zScale: number) {

            var scaleMat = Matrix3D.createScaleMatrix3D(xScale, yScale, zScale);
            this.append(scaleMat);
        }

        /**
         * 在 Matrix3D 对象上后置一个增量平移，沿 x、y 和 z 轴重新定位。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
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
         * @param   column      副本的目标列。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        public copyColumnFrom(column: number, vector3D: Vector3D) {
            this.rawData[column * 4 + 0] = vector3D.x;
            this.rawData[column * 4 + 1] = vector3D.y;
            this.rawData[column * 4 + 2] = vector3D.z;
            this.rawData[column * 4 + 3] = vector3D.w;
        }

        /**
         * 将调用方 Matrix3D 对象的特定列复制到 Vector3D 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3D 对象。
         */
        public copyColumnTo(column: number, vector3D: Vector3D) {
            vector3D.x = this.rawData[column * 4 + 0];
            vector3D.y = this.rawData[column * 4 + 1];
            vector3D.z = this.rawData[column * 4 + 2];
            vector3D.w = this.rawData[column * 4 + 3];
        }

        /**
         * 将源 Matrix3D 对象中的所有矩阵数据复制到调用方 Matrix3D 对象中。
         * @param   sourceMatrix3D      要从中复制数据的 Matrix3D 对象。
         */
        public copyFrom(sourceMatrix3D: Matrix3D): void {
            for (var i = 0; i < 16; i++) {
                this.rawData[i] = sourceMatrix3D.rawData[i];
            }
        }

        /**
         * 将源 Vector 对象中的所有矢量数据复制到调用方 Matrix3D 对象中。利用可选索引参数，您可以选择矢量中的任何起始文字插槽。
         * @param   vector      要从中复制数据的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        public copyRawDataFrom(vector: Array<number>, index: number = 0, transpose: boolean = false): void {
            if (vector.length - index < 16) {
                throw new ArgumentError();
            }
            for (var i = 0; i < 16; i++) {
                this.rawData[i] = vector[index + i];
            }
            if (transpose) {
                this.transpose();
            }
        }

        /**
         * 将调用方 Matrix3D 对象中的所有矩阵数据复制到提供的矢量中。
         * @param   vector      要将数据复制到的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        public copyRawDataTo(vector: Array<number>, index: number = 0, transpose: boolean = false) {
            if (transpose) {
                this.transpose();
            }
            for (var i = 0; i < 16; i++) {
                vector[i + index] = this.rawData[i];
            }
            if (transpose) {
                this.transpose();
            }
        }

        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定行中。
         * @param   row         要将数据复制到的行。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        public copyRowFrom(row: number, vector3D: Vector3D) {

            this.rawData[row + 4 * 0] = vector3D.x;
            this.rawData[row + 4 * 1] = vector3D.y;
            this.rawData[row + 4 * 2] = vector3D.z;
            this.rawData[row + 4 * 3] = vector3D.w;
        }

        /**
         * 将调用方 Matrix3D 对象的特定行复制到 Vector3D 对象中。
         * @param   row         要从中复制数据的行。
         * @param   vector3D    将作为数据复制目的地的 Vector3D 对象。
         */
        public copyRowTo(row: number, vector3D: Vector3D) {

            vector3D.x = this.rawData[row + 4 * 0];
            vector3D.y = this.rawData[row + 4 * 1];
            vector3D.z = this.rawData[row + 4 * 2];
            vector3D.w = this.rawData[row + 4 * 3];
        }

        /**
         * 拷贝当前矩阵
         * @param   dest    目标矩阵
         */
        public copyToMatrix3D(dest: Matrix3D) {
            dest.rawData = this.rawData.slice(0);
        }

        /**
         * 将转换矩阵的平移、旋转和缩放设置作为由三个 Vector3D 对象组成的矢量返回。
         * @param       orientationStyle    一个可选参数，它确定用于矩阵转换的方向样式。
         * @return      一个由三个 Vector3D 对象组成的矢量，其中，每个对象分别容纳平移、旋转和缩放设置。
         */
        public decompose(orientationStyle: string = "eulerAngles"): Vector3D[] {
            alert("未实现" + "Matrix3D.decompose");
            return null;
        }

        /**
         * 使用不含平移元素的转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   v   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
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
         * 朝着目标矩阵的平移、旋转和缩放转换插补某个矩阵的这些转换。使用四元素对方向进行插值。
         * @param   thisMat     要插补的 Matrix3D 对象。
         * @param   toMat       目标 Matrix3D 对象。
         * @param   percent     一个介于 0 和 1 之间的值，它确定显示对象相对于目标的位置。该值越接近于 1.0，显示对象就越靠近其当前位置。该值越接近于 0，显示对象就越靠近其目标。
         * @return      一个 Matrix3D 对象，其中包含用于放置原始矩阵和目标矩阵之间的矩阵值的元素。在将返回的矩阵应用于 this 显示对象时，该对象会朝着目标对象移动到指定的百分比位置。
         */
        public static interpolate(thisMat: Matrix3D, toMat: Matrix3D, percent: number): Matrix3D {
            alert("未实现" + "Matrix3D.interpolate");
            return null;
        }

        /**
         * 朝着目标矩阵的平移、旋转和缩放转换插补此矩阵。使用四元素对方向进行插值。
         * @param   toMat       目标 Matrix3D 对象。
         * @param   percent     一个介于 0 和 1 之间的值，它确定显示对象相对于目标的位置。该值越接近于 1.0，显示对象就越靠近其当前位置。该值越接近于 0，显示对象就越靠近其目标。
         */
        public interpolateTo(toMat: Matrix3D, percent: number): void {

            alert("未实现" + "Matrix3D.interpolateTo");
        }

        /**
         * 反转当前矩阵。
         * @return      如果成功反转矩阵，则返回 true。
         */
        public invert(): boolean {
            alert("未实现" + "Matrix3D.invert");
            return false;
        }

        /**
         * 旋转显示对象以使其朝向指定的位置。
         * @param   pos     目标对象的相对于现实世界的位置。相对于现实世界定义了相对于所有对象所在的现实世界空间和坐标的对象转换。
         * @param   at      用于定义显示对象所指向的位置的相对于对象的矢量。
         * @param   up      用于为显示对象定义“向上”方向的相对于对象的矢量。
         */
        public pointAt(pos: Vector3D, at: Vector3D = null, up: Vector3D = null): void {

            alert("未实现" + "Matrix3D.pointAt");
        }

        /**
         * 通过将当前 Matrix3D 对象与另一个 Matrix3D 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
         * @param   rhs     个右侧矩阵，它与当前 Matrix3D 对象相乘。
         */
        public prepend(rhs: Matrix3D): void {
            alert("未实现" + "Matrix3D.prepend");
        }

        /**
         * 在 Matrix3D 对象上前置一个增量旋转。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行旋转，然后再执行其他转换。
         * @param   degrees     旋转的角度。
         * @param   axis        旋转的轴或方向。常见的轴为 X_AXIS (Vector3D(1,0,0))、Y_AXIS (Vector3D(0,1,0)) 和 Z_AXIS (Vector3D(0,0,1))。此矢量的长度应为 1。
         * @param   pivotPoint  一个用于确定旋转中心的点。对象的默认轴点为该对象的注册点。
         */
        public prependRotation(degrees: number, axis: Vector3D, pivotPoint: Vector3D = new Vector3D()): void {
            alert("未实现" + "Matrix3D.prependRotation");
        }

        /**
         * 在 Matrix3D 对象上前置一个增量缩放，沿 x、y 和 z 轴改变位置。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行缩放更改，然后再执行其他转换。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        public prependScale(xScale: number, yScale: number, zScale: number): void {
            alert("未实现" + "Matrix3D.prependScale");
        }

        /**
         * 在 Matrix3D 对象上前置一个增量平移，沿 x、y 和 z 轴重新定位。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行平移更改，然后再执行其他转换。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        public prependTranslation(x: number, y: number, z: number): void {
            alert("未实现" + "Matrix3D.prependTranslation");
        }

        /**
         * 设置转换矩阵的平移、旋转和缩放设置。
         * @param   components      一个由三个 Vector3D 对象组成的矢量，这些对象将替代 Matrix3D 对象的平移、旋转和缩放元素。
         * @param   orientationStyle    一个可选参数，它确定用于矩阵转换的方向样式。
         */
        public recompose(components: Vector3D[], orientationStyle: String = "eulerAngles"): boolean {

            alert("未实现" + "Matrix3D.recompose");
            return true;
        }

        /**
         * 使用转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   v   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        public transformVector(v: Vector3D): Vector3D {
            alert("未实现" + "Matrix3D.transformVector");
            return null;
        }

        /**
         * 使用转换矩阵将由数字构成的矢量从一个空间坐标转换到另一个空间坐标。
         * @param   vin     一个由多个数字组成的矢量，其中每三个数字构成一个要转换的 3D 坐标 (x,y,z)。
         * @param   vout    一个由多个数字组成的矢量，其中每三个数字构成一个已转换的 3D 坐标 (x,y,z)。
         */
        public transformVectors(vin: Number[], vout: Number[]): void {

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