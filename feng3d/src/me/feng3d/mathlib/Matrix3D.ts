module me.feng3d {

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
        public rawData: Float32Array;

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
         * 前方（+Z轴方向）
         */
        public get forward(): Vector3D {

            var v = new Vector3D(0.0, 0.0, 0.0);

            this.copyColumnTo(2, v);
            v.normalize();
            return v;
        }

        /**
         * 上方（+y轴方向）
         */
        public get up(): Vector3D {

            var v = new Vector3D();
            this.copyColumnTo(1, v);
            v.normalize();
            return v;
        }

        /**
         * 右方（+x轴方向）
         */
        public get right(): Vector3D {

            var v = new Vector3D();
            this.copyColumnTo(0, v);
            v.normalize();
            return v;
        }

        /**
         * 创建 Matrix3D 对象。
         * @param   datas    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        constructor(datas: Float32Array | number[] = null) {

            datas = datas || [//
                1, 0, 0, 0,// 
                0, 1, 0, 0,// 
                0, 0, 1, 0,//
                0, 0, 0, 1//
            ];

            if (datas instanceof Float32Array)
                this.rawData = datas
            else {
                this.rawData = new Float32Array(datas);
            }
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
         * 创建位移矩阵
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        public static createTranslationMatrix3D(x: number, y: number, z: number): Matrix3D {

            var rotationMat: Matrix3D = new Matrix3D([//
                1, 0, 0, 0,//
                0, 1, 0, 0,//
                0, 0, 1, 0,//
                x, y, z, 1//
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
        public appendRotation(degrees: number, axis: Vector3D, pivotPoint: Vector3D = new Vector3D()) {

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
        public copyFrom(sourceMatrix3D: Matrix3D) {
            this.rawData.set(sourceMatrix3D.rawData);
        }

        /**
         * 将源 Vector 对象中的所有矢量数据复制到调用方 Matrix3D 对象中。利用可选索引参数，您可以选择矢量中的任何起始文字插槽。
         * @param   vector      要从中复制数据的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        public copyRawDataFrom(vector: Float32Array, index: number = 0, transpose: boolean = false) {
            if (vector.length - index < 16) {
                throw new Error("vector参数数据长度不够！");
            }
            if (transpose) {
                this.transpose();
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
            dest.rawData.set(this.rawData);
        }

        /**
         * 将转换矩阵的平移、旋转和缩放设置作为由三个 Vector3D 对象组成的矢量返回。
         * @return      一个由三个 Vector3D 对象组成的矢量，其中，每个对象分别容纳平移、旋转和缩放设置。
         */
        public decompose(): Vector3D[] {
            var vec: Vector3D[] = [];
            var m = this.clone();
            var mr = m.rawData;

            var pos: Vector3D = new Vector3D(mr[12], mr[13], mr[14]);
            mr[12] = 0;
            mr[13] = 0;
            mr[14] = 0;

            var scale: Vector3D = new Vector3D();

            scale.x = Math.sqrt(mr[0] * mr[0] + mr[1] * mr[1] + mr[2] * mr[2]);
            scale.y = Math.sqrt(mr[4] * mr[4] + mr[5] * mr[5] + mr[6] * mr[6]);
            scale.z = Math.sqrt(mr[8] * mr[8] + mr[9] * mr[9] + mr[10] * mr[10]);

            if (mr[0] * (mr[5] * mr[10] - mr[6] * mr[9]) - mr[1] * (mr[4] * mr[10] - mr[6] * mr[8]) + mr[2] * (mr[4] * mr[9] - mr[5] * mr[8]) < 0)
                scale.z = -scale.z;

            mr[0] /= scale.x;
            mr[1] /= scale.x;
            mr[2] /= scale.x;
            mr[4] /= scale.y;
            mr[5] /= scale.y;
            mr[6] /= scale.y;
            mr[8] /= scale.z;
            mr[9] /= scale.z;
            mr[10] /= scale.z;

            var rot = new Vector3D();

            rot.y = Math.asin(-mr[2]);

            if (mr[2] != 1 && mr[2] != -1) {
                rot.x = Math.atan2(mr[6], mr[10]);
                rot.z = Math.atan2(mr[1], mr[0]);
            } else {
                rot.z = 0;
                rot.x = Math.atan2(mr[4], mr[5]);
            }

            vec.push(pos);
            vec.push(rot);
            vec.push(scale);

            return vec;
        }

        /**
         * 使用不含平移元素的转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   v   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        public deltaTransformVector(v: Vector3D): Vector3D {

            var tempx = this.rawData[12];
            var tempy = this.rawData[13];
            var tempz = this.rawData[14];

            this.rawData[12] = 0;
            this.rawData[13] = 0;
            this.rawData[14] = 0;

            var result = this.transformVector(v)

            this.rawData[12] = tempx;
            this.rawData[13] = tempy;
            this.rawData[14] = tempz;

            return result;
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
         * 反转当前矩阵。逆矩阵
         * @return      如果成功反转矩阵，则返回 true。
         */
        public invert(): boolean {
            var d = this.determinant;
            var invertable = Math.abs(d) > 0.00000000001;

            if (invertable) {
                d = 1 / d;
                var m11: number = this.rawData[0];
                var m21: number = this.rawData[4];
                var m31: number = this.rawData[8];
                var m41: number = this.rawData[12];
                var m12: number = this.rawData[1];
                var m22: number = this.rawData[5];
                var m32: number = this.rawData[9];
                var m42: number = this.rawData[13];
                var m13: number = this.rawData[2];
                var m23: number = this.rawData[6];
                var m33: number = this.rawData[10];
                var m43: number = this.rawData[14];
                var m14: number = this.rawData[3];
                var m24: number = this.rawData[7];
                var m34: number = this.rawData[11];
                var m44: number = this.rawData[15];

                this.rawData[0] = d * (m22 * (m33 * m44 - m43 * m34) - m32 * (m23 * m44 - m43 * m24) + m42 * (m23 * m34 - m33 * m24));
                this.rawData[1] = -d * (m12 * (m33 * m44 - m43 * m34) - m32 * (m13 * m44 - m43 * m14) + m42 * (m13 * m34 - m33 * m14));
                this.rawData[2] = d * (m12 * (m23 * m44 - m43 * m24) - m22 * (m13 * m44 - m43 * m14) + m42 * (m13 * m24 - m23 * m14));
                this.rawData[3] = -d * (m12 * (m23 * m34 - m33 * m24) - m22 * (m13 * m34 - m33 * m14) + m32 * (m13 * m24 - m23 * m14));
                this.rawData[4] = -d * (m21 * (m33 * m44 - m43 * m34) - m31 * (m23 * m44 - m43 * m24) + m41 * (m23 * m34 - m33 * m24));
                this.rawData[5] = d * (m11 * (m33 * m44 - m43 * m34) - m31 * (m13 * m44 - m43 * m14) + m41 * (m13 * m34 - m33 * m14));
                this.rawData[6] = -d * (m11 * (m23 * m44 - m43 * m24) - m21 * (m13 * m44 - m43 * m14) + m41 * (m13 * m24 - m23 * m14));
                this.rawData[7] = d * (m11 * (m23 * m34 - m33 * m24) - m21 * (m13 * m34 - m33 * m14) + m31 * (m13 * m24 - m23 * m14));
                this.rawData[8] = d * (m21 * (m32 * m44 - m42 * m34) - m31 * (m22 * m44 - m42 * m24) + m41 * (m22 * m34 - m32 * m24));
                this.rawData[9] = -d * (m11 * (m32 * m44 - m42 * m34) - m31 * (m12 * m44 - m42 * m14) + m41 * (m12 * m34 - m32 * m14));
                this.rawData[10] = d * (m11 * (m22 * m44 - m42 * m24) - m21 * (m12 * m44 - m42 * m14) + m41 * (m12 * m24 - m22 * m14));
                this.rawData[11] = -d * (m11 * (m22 * m34 - m32 * m24) - m21 * (m12 * m34 - m32 * m14) + m31 * (m12 * m24 - m22 * m14));
                this.rawData[12] = -d * (m21 * (m32 * m43 - m42 * m33) - m31 * (m22 * m43 - m42 * m23) + m41 * (m22 * m33 - m32 * m23));
                this.rawData[13] = d * (m11 * (m32 * m43 - m42 * m33) - m31 * (m12 * m43 - m42 * m13) + m41 * (m12 * m33 - m32 * m13));
                this.rawData[14] = -d * (m11 * (m22 * m43 - m42 * m23) - m21 * (m12 * m43 - m42 * m13) + m41 * (m12 * m23 - m22 * m13));
                this.rawData[15] = d * (m11 * (m22 * m33 - m32 * m23) - m21 * (m12 * m33 - m32 * m13) + m31 * (m12 * m23 - m22 * m13));
            }
            return invertable;
        }

        /**
         * 通过将当前 Matrix3D 对象与另一个 Matrix3D 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
         * @param   rhs     个右侧矩阵，它与当前 Matrix3D 对象相乘。
         */
        public prepend(rhs: Matrix3D) {

            var mat = this.clone();
            this.copyFrom(rhs);
            this.append(mat);
        }

        /**
         * 在 Matrix3D 对象上前置一个增量旋转。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行旋转，然后再执行其他转换。
         * @param   degrees     旋转的角度。
         * @param   axis        旋转的轴或方向。常见的轴为 X_AXIS (Vector3D(1,0,0))、Y_AXIS (Vector3D(0,1,0)) 和 Z_AXIS (Vector3D(0,0,1))。此矢量的长度应为 1。
         * @param   pivotPoint  一个用于确定旋转中心的点。对象的默认轴点为该对象的注册点。
         */
        public prependRotation(degrees: number, axis: Vector3D, pivotPoint: Vector3D = new Vector3D()) {
            var rotationMat = Matrix3D.createRotationMatrix3D(degrees, axis);
            this.prepend(rotationMat);
        }

        /**
         * 在 Matrix3D 对象上前置一个增量缩放，沿 x、y 和 z 轴改变位置。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行缩放更改，然后再执行其他转换。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        public prependScale(xScale: number, yScale: number, zScale: number) {
            var scaleMat = Matrix3D.createScaleMatrix3D(xScale, yScale, zScale);
            this.prepend(scaleMat);
        }

        /**
         * 在 Matrix3D 对象上前置一个增量平移，沿 x、y 和 z 轴重新定位。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行平移更改，然后再执行其他转换。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        public prependTranslation(x: number, y: number, z: number) {
            var translationMat = Matrix3D.createTranslationMatrix3D(x, y, z);
            this.prepend(translationMat);
        }

        /**
         * 设置转换矩阵的平移、旋转和缩放设置。
         * @param   components      一个由三个 Vector3D 对象组成的矢量，这些对象将替代 Matrix3D 对象的平移、旋转和缩放元素。
         */
        public recompose(components: Vector3D[]): void {

            this.identity();
            this.appendRotation(components[1].x * MathConsts.RADIANS_TO_DEGREES, Vector3D.X_AXIS);
            this.appendRotation(components[1].y * MathConsts.RADIANS_TO_DEGREES, Vector3D.Y_AXIS);
            this.appendRotation(components[1].z * MathConsts.RADIANS_TO_DEGREES, Vector3D.Z_AXIS);
            this.appendScale(components[2].x, components[2].y, components[2].z);
            this.appendTranslation(components[0].x, components[0].y, components[0].z);
        }

        /**
         * 使用转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        public transformVector(vin: Vector3D, vout?: Vector3D): Vector3D {

            var x: number = vin.x;
            var y: number = vin.y;
            var z: number = vin.z;

            vout = vout || new Vector3D();
            vout.x = x * this.rawData[0] + y * this.rawData[4] + z * this.rawData[8] + this.rawData[12];
            vout.y = x * this.rawData[1] + y * this.rawData[5] + z * this.rawData[9] + this.rawData[13];
            vout.z = x * this.rawData[2] + y * this.rawData[6] + z * this.rawData[10] + this.rawData[14];
            vout.w = x * this.rawData[3] + y * this.rawData[7] + z * this.rawData[11] + this.rawData[15];

            return vout;
        }

        /**
         * 使用转换矩阵将由数字构成的矢量从一个空间坐标转换到另一个空间坐标。
         * @param   vin     一个由多个数字组成的矢量，其中每三个数字构成一个要转换的 3D 坐标 (x,y,z)。
         * @param   vout    一个由多个数字组成的矢量，其中每三个数字构成一个已转换的 3D 坐标 (x,y,z)。
         */
        public transformVectors(vin: number[], vout: number[]) {

            var vec = new Vector3D();
            for (var i = 0; i < vin.length; i += 3) {
                vec.setTo(vin[i], vin[i + 1], vin[i + 2]);
                vec = this.transformVector(vec);
                vout[i] = vec.x;
                vout[i + 1] = vec.y;
                vout[i + 2] = vec.z;
            }
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
         * 比较矩阵是否相等
         */
        public compare(matrix3D: Matrix3D, precision: number = 0.0001): boolean {
            var r2 = matrix3D.rawData;
            for (var i: number = 0; i < 16; ++i) {
                if (Math.abs(this.rawData[i] - r2[i]) > precision)
                    return false;
            }

            return true;
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