namespace feng3d
{

    /**
     * Matrix4x4 类表示一个转换矩阵，该矩阵确定三维 (3D) 显示对象的位置和方向。
     * 该矩阵可以执行转换功能，包括平移（沿 x、y 和 z 轴重新定位）、旋转和缩放（调整大小）。
     * Matrix4x4 类还可以执行透视投影，这会将 3D 坐标空间中的点映射到二维 (2D) 视图。
     * ```
     *  ---                                   ---
     *  |   scaleX      0         0       0     |   x轴
     *  |     0       scaleY      0       0     |   y轴
     *  |     0         0       scaleZ    0     |   z轴
     *  |     tx        ty        tz      tw    |   平移
     *  ---                                   ---
     * 
     *  ---                                   ---
     *  |     0         1         2        3    |   x轴
     *  |     4         5         6        7    |   y轴
     *  |     8         9         10       11   |   z轴
     *  |     12        13        14       15   |   平移
     *  ---                                   ---
     * ```
     */
    export class Matrix4x4
    {
        /**
         * 用于运算临时变量
         */
        static RAW_DATA_CONTAINER = [//
            1, 0, 0, 0,// 
            0, 1, 0, 0,// 
            0, 0, 1, 0,//
            0, 0, 0, 1//
        ];
        /**
         * 一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        @serialize
        rawData: number[];

        /**
         * 一个保存显示对象在转换参照帧中的 3D 坐标 (x,y,z) 位置的 Vector3 对象。
         */
        get position()
        {
            return new Vector3(this.rawData[12], this.rawData[13], this.rawData[14]);
        }

        set position(value: Vector3)
        {
            this.rawData[12] = value.x;
            this.rawData[13] = value.y;
            this.rawData[14] = value.z;
        }

        /**
         * 一个用于确定矩阵是否可逆的数字。
         */
        get determinant()
        {
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
        get forward()
        {
            return this.copyColumnToVector3(2).normalize();
        }

        /**
         * 上方（+y轴方向）
         */
        get up()
        {
            return this.copyColumnToVector3(1).normalize();
        }

        /**
         * 右方（+x轴方向）
         */
        get right()
        {
            return this.copyColumnToVector3(0).normalize();
        }

        /**
         * 后方（-z轴方向）
         */
        get back()
        {
            return this.copyColumnToVector3(2).normalize().negate();
        }

        /**
         * 下方（-y轴方向）
         */
        get down()
        {
            return this.copyColumnToVector3(1).normalize().negate();
        }

        /**
         * 左方（-x轴方向）
         */
        get left()
        {
            return this.copyColumnToVector3(0).normalize().negate();
        }

        /**
         * 创建 Matrix4x4 对象。
         * @param   datas    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        constructor(datas?: number[])
        {
            this.rawData = datas || [//
                1, 0, 0, 0,// 
                0, 1, 0, 0,// 
                0, 0, 1, 0,//
                0, 0, 0, 1//
            ];
        }

        /**
         * 创建旋转矩阵
         * @param   axis            旋转轴
         * @param   degrees         角度
         */
        static fromAxisRotate(axis: Vector3, degrees: number)
        {
            var n = axis.clone();
            n.normalize();
            var q = degrees * Math.PI / 180;

            var sinq = Math.sin(q);
            var cosq = Math.cos(q);
            var lcosq = 1 - cosq;

            var rotationMat: Matrix4x4 = new Matrix4x4([//
                n.x * n.x * lcosq + cosq, n.x * n.y * lcosq + n.z * sinq, n.x * n.z * lcosq - n.y * sinq, 0,//
                n.x * n.y * lcosq - n.z * sinq, n.y * n.y * lcosq + cosq, n.y * n.z * lcosq + n.x * sinq, 0,//
                n.x * n.z * lcosq + n.y * sinq, n.y * n.z * lcosq - n.x * sinq, n.z * n.z * lcosq + cosq, 0,//
                0, 0, 0, 1//
            ]);
            return rotationMat;
        }

        /**
         * 创建旋转矩阵
         * @param   rx      用于沿 x 轴旋转对象的角度。
         * @param   ry      用于沿 y 轴旋转对象的角度。
         * @param   rz      用于沿 z 轴旋转对象的角度。      
         */
        static fromRotation(rx: number, ry: number, rz: number): Matrix4x4
        {
            rx = FMath.degToRad(rx);
            ry = FMath.degToRad(ry);
            rz = FMath.degToRad(rz);

            var sx = Math.sin(rx), cx = Math.cos(rx), sy = Math.sin(ry), cy = Math.cos(ry), sz = Math.sin(rz), cz = Math.cos(rz);

            return new Matrix4x4([
                cy * cz, cy * sz, -sy, 0,
                sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy, 0,
                cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy, 0,
                0, 0, 0, 1,
            ]);
        }

        /**
         * 创建缩放矩阵
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        static fromScale(xScale: number, yScale: number, zScale: number)
        {
            var rotationMat = new Matrix4x4([//
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
        static fromPosition(x: number, y: number, z: number)
        {
            var rotationMat: Matrix4x4 = new Matrix4x4([//
                1, 0, 0, 0,//
                0, 1, 0, 0,//
                0, 0, 1, 0,//
                x, y, z, 1//
            ]);
            return rotationMat;
        }

        /**
         * 通过将另一个 Matrix4x4 对象与当前 Matrix4x4 对象相乘来后置一个矩阵。
         */
        append(lhs: Matrix4x4)
        {
            var //
                m111 = this.rawData[0], m121 = this.rawData[4], m131 = this.rawData[8], m141 = this.rawData[12],//
                m112 = this.rawData[1], m122 = this.rawData[5], m132 = this.rawData[9], m142 = this.rawData[13],//
                m113 = this.rawData[2], m123 = this.rawData[6], m133 = this.rawData[10], m143 = this.rawData[14],//
                m114 = this.rawData[3], m124 = this.rawData[7], m134 = this.rawData[11], m144 = this.rawData[15], //

                m211 = lhs.rawData[0], m221 = lhs.rawData[4], m231 = lhs.rawData[8], m241 = lhs.rawData[12], //
                m212 = lhs.rawData[1], m222 = lhs.rawData[5], m232 = lhs.rawData[9], m242 = lhs.rawData[13], //
                m213 = lhs.rawData[2], m223 = lhs.rawData[6], m233 = lhs.rawData[10], m243 = lhs.rawData[14], //
                m214 = lhs.rawData[3], m224 = lhs.rawData[7], m234 = lhs.rawData[11], m244 = lhs.rawData[15];

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

            debuger && assert(this.rawData[0] !== NaN && this.rawData[4] !== NaN && this.rawData[8] !== NaN && this.rawData[12] !== NaN);

            return this;
        }

        /**
         * 在 Matrix4x4 对象上后置一个增量旋转。
         * @param   axis            旋转轴
         * @param   degrees         角度
         * @param   pivotPoint      旋转中心点
         */
        appendRotation(axis: Vector3, degrees: number, pivotPoint?: Vector3)
        {
            var rotationMat = Matrix4x4.fromAxisRotate(axis, degrees);

            if (pivotPoint != null)
            {
                this.appendTranslation(-pivotPoint.x, -pivotPoint.y, -pivotPoint.z)
            }

            this.append(rotationMat);

            if (pivotPoint != null)
            {
                this.appendTranslation(pivotPoint.x, pivotPoint.y, pivotPoint.z)
            }
            return this;
        }

        /**
         * 在 Matrix4x4 对象上后置一个增量缩放，沿 x、y 和 z 轴改变位置。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        appendScale(xScale: number, yScale: number, zScale: number)
        {
            var scaleMat = Matrix4x4.fromScale(xScale, yScale, zScale);
            this.append(scaleMat);
            return this;
        }

        /**
         * 在 Matrix4x4 对象上后置一个增量平移，沿 x、y 和 z 轴重新定位。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        appendTranslation(x: number, y: number, z: number)
        {
            this.rawData[12] += x;
            this.rawData[13] += y;
            this.rawData[14] += z;
            return this;
        }

        /**
         * 返回一个新 Matrix4x4 对象，它是与当前 Matrix4x4 对象完全相同的副本。
         */
        clone()
        {
            var ret: Matrix4x4 = new Matrix4x4();
            ret.copyFrom(this);
            return ret;
        }

        /**
         * 将 Vector3 对象复制到调用方 Matrix4x4 对象的特定列中。
         * @param   column      副本的目标列。
         * @param   vector3D    要从中复制数据的 Vector3 对象。
         */
        copyColumnFrom(column: number, vector3D: Vector4)
        {
            this.rawData[column * 4 + 0] = vector3D.x;
            this.rawData[column * 4 + 1] = vector3D.y;
            this.rawData[column * 4 + 2] = vector3D.z;
            this.rawData[column * 4 + 3] = vector3D.w;
            return this;
        }

        /**
         * 将调用方 Matrix4x4 对象的特定列复制到 Vector3 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3 对象。
         */
        copyColumnToVector3(column: number, vector3D = new Vector3())
        {
            this.copyColumnToVector4(column, Vector4.fromVector3(vector3D)).toVector3(vector3D);
            return vector3D;
        }

        /**
         * 将调用方 Matrix4x4 对象的特定列复制到 Vector3 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3 对象。
         */
        copyColumnToVector4(column: number, vector3D = new Vector4())
        {
            vector3D.x = this.rawData[column * 4 + 0];
            vector3D.y = this.rawData[column * 4 + 1];
            vector3D.z = this.rawData[column * 4 + 2];
            vector3D.w = this.rawData[column * 4 + 3];
            return vector3D;
        }

        /**
         * 将源 Matrix4x4 对象中的所有矩阵数据复制到调用方 Matrix4x4 对象中。
         * @param   sourceMatrix3D      要从中复制数据的 Matrix4x4 对象。
         */
        copyFrom(sourceMatrix3D: Matrix4x4)
        {
            for (var i = 0; i < 16; i++)
            {
                this.rawData[i] = sourceMatrix3D.rawData[i];
            }
            return this;
        }

        /**
         * 将源 Vector 对象中的所有矢量数据复制到调用方 Matrix4x4 对象中。利用可选索引参数，您可以选择矢量中的任何起始文字插槽。
         * @param   vector      要从中复制数据的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataFrom(vector: number[], index = 0, transpose = false)
        {
            if (vector.length - index < 16)
            {
                throw new Error("vector参数数据长度不够！");
            }
            if (transpose)
            {
                this.transpose();
            }
            for (var i = 0; i < 16; i++)
            {
                this.rawData[i] = vector[index + i];
            }
            if (transpose)
            {
                this.transpose();
            }
            return this;
        }

        /**
         * 将调用方 Matrix4x4 对象中的所有矩阵数据复制到提供的矢量中。
         * @param   vector      要将数据复制到的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataTo(vector: number[] | Float32Array, index = 0, transpose = false)
        {
            if (transpose)
            {
                this.transpose();
            }
            for (var i = 0; i < 16; i++)
            {
                vector[i + index] = this.rawData[i];
            }
            if (transpose)
            {
                this.transpose();
            }
            return this;
        }

        /**
         * 将 Vector3 对象复制到调用方 Matrix4x4 对象的特定行中。
         * @param   row         要将数据复制到的行。
         * @param   vector3D    要从中复制数据的 Vector3 对象。
         */
        copyRowFrom(row: number, vector3D: Vector4)
        {
            this.rawData[row + 4 * 0] = vector3D.x;
            this.rawData[row + 4 * 1] = vector3D.y;
            this.rawData[row + 4 * 2] = vector3D.z;
            this.rawData[row + 4 * 3] = vector3D.w;
            return this;
        }

        /**
         * 将调用方 Matrix4x4 对象的特定行复制到 Vector3 对象中。
         * @param   row         要从中复制数据的行。
         * @param   vector3D    将作为数据复制目的地的 Vector3 对象。
         */
        copyRowTo(row: number, vector3D: Vector4)
        {
            vector3D.x = this.rawData[row + 4 * 0];
            vector3D.y = this.rawData[row + 4 * 1];
            vector3D.z = this.rawData[row + 4 * 2];
            vector3D.w = this.rawData[row + 4 * 3];
            return this;
        }

        /**
         * 拷贝当前矩阵
         * @param   dest    目标矩阵
         */
        copyToMatrix3D(dest: Matrix4x4)
        {
            dest.rawData = this.rawData.concat();
            return this;
        }

        /**
         * 将转换矩阵的平移、旋转和缩放设置作为由三个 Vector3 对象组成的矢量返回。
         * @return      一个由三个 Vector3 对象组成的矢量，其中，每个对象分别容纳平移、旋转和缩放设置。
         */
        decompose(orientationStyle: Orientation3D = Orientation3D.EULER_ANGLES, result?: Vector3[])
        {
            var raw = this.rawData;

            var a = raw[0];
            var e = raw[1];
            var i = raw[2];
            var b = raw[4];
            var f = raw[5];
            var j = raw[6];
            var c = raw[8];
            var g = raw[9];
            var k = raw[10];

            var x = raw[12];
            var y = raw[13];
            var z = raw[14];

            var tx = Math.sqrt(a * a + e * e + i * i);
            var ty = Math.sqrt(b * b + f * f + j * j);
            var tz = Math.sqrt(c * c + g * g + k * k);
            var tw = 0;

            var scaleX = tx;
            var scaleY = ty;
            var scaleZ = tz;

            if (a * (f * k - j * g) - e * (b * k - j * c) + i * (b * g - f * c) < 0)
            {
                scaleZ = -scaleZ;
            }

            a = a / scaleX;
            e = e / scaleX;
            i = i / scaleX;
            b = b / scaleY;
            f = f / scaleY;
            j = j / scaleY;
            c = c / scaleZ;
            g = g / scaleZ;
            k = k / scaleZ;

            if (orientationStyle == Orientation3D.EULER_ANGLES)
            {
                tx = Math.atan2(j, k);
                ty = Math.atan2(-i, Math.sqrt(a * a + e * e));
                var s1 = Math.sin(tx);
                var c1 = Math.cos(tx);
                tz = Math.atan2(s1 * c - c1 * b, c1 * f - s1 * g);
            }
            else if (orientationStyle == Orientation3D.AXIS_ANGLE)
            {
                tw = Math.acos((a + f + k - 1) / 2);
                var len = Math.sqrt((j - g) * (j - g) + (c - i) * (c - i) + (e - b) * (e - b));
                tx = (j - g) / len;
                ty = (c - i) / len;
                tz = (e - b) / len;
            }
            else
            { //Orientation3D.QUATERNION
                var tr = a + f + k;
                if (tr > 0)
                {
                    tw = Math.sqrt(1 + tr) / 2;
                    tx = (j - g) / (4 * tw);
                    ty = (c - i) / (4 * tw);
                    tz = (e - b) / (4 * tw);
                }
                else if ((a > f) && (a > k))
                {
                    tx = Math.sqrt(1 + a - f - k) / 2;
                    tw = (j - g) / (4 * tx);
                    ty = (e + b) / (4 * tx);
                    tz = (c + i) / (4 * tx);
                }
                else if (f > k)
                {
                    ty = Math.sqrt(1 + f - a - k) / 2;
                    tx = (e + b) / (4 * ty);
                    tw = (c - i) / (4 * ty);
                    tz = (j + g) / (4 * ty);
                }
                else
                {
                    tz = Math.sqrt(1 + k - a - f) / 2;
                    tx = (c + i) / (4 * tz);
                    ty = (j + g) / (4 * tz);
                    tw = (e - b) / (4 * tz);
                }
            }

            result = result || [new Vector3(), new Vector3(), new Vector3()];
            result[0].x = x;
            result[0].y = y;
            result[0].z = z;
            result[1].x = tx;
            result[1].y = ty;
            result[1].z = tz;
            result[2].x = scaleX;
            result[2].y = scaleY;
            result[2].z = scaleZ;
            return result;
        }

        /**
         * 使用不含平移元素的转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
         * @param   v   一个容纳要转换的坐标的 Vector3 对象。
         * @return  一个包含转换后的坐标的 Vector3 对象。
         */
        deltaTransformVector(v: Vector3, vout = new Vector3())
        {
            var v4 = Vector4.fromVector3(v, 0);
            //
            this.transformVector4(v4, v4);
            //
            v4.toVector3(vout);
            return vout;
        }

        /**
         * 将当前矩阵转换为恒等或单位矩阵。
         */
        identity()
        {
            var r = this.rawData;

            r[1] = 0; r[2] = 0; r[3] = 0; r[4] = 0;
            r[6] = 0; r[7] = 0; r[8] = 0; r[9] = 0;
            r[11] = 0; r[12] = 0; r[13] = 0; r[14] = 0;
            r[0] = 1; r[5] = 1; r[10] = 1; r[15] = 1;
            return this;
        }

        /**
         * 反转当前矩阵。逆矩阵
         * @return      如果成功反转矩阵，则返回 该矩阵。
         */
        invert()
        {
            var d = this.determinant;

            if (d == 0)
            {
                error("无法获取逆矩阵");
                return this;
            }
            d = 1 / d;

            var r = this.rawData;

            var m11 = r[0]; var m21 = r[4]; var m31 = r[8]; var m41 = r[12];
            var m12 = r[1]; var m22 = r[5]; var m32 = r[9]; var m42 = r[13];
            var m13 = r[2]; var m23 = r[6]; var m33 = r[10]; var m43 = r[14];
            var m14 = r[3]; var m24 = r[7]; var m34 = r[11]; var m44 = r[15];

            r[0] = d * (m22 * (m33 * m44 - m43 * m34) - m32 * (m23 * m44 - m43 * m24) + m42 * (m23 * m34 - m33 * m24));
            r[1] = -d * (m12 * (m33 * m44 - m43 * m34) - m32 * (m13 * m44 - m43 * m14) + m42 * (m13 * m34 - m33 * m14));
            r[2] = d * (m12 * (m23 * m44 - m43 * m24) - m22 * (m13 * m44 - m43 * m14) + m42 * (m13 * m24 - m23 * m14));
            r[3] = -d * (m12 * (m23 * m34 - m33 * m24) - m22 * (m13 * m34 - m33 * m14) + m32 * (m13 * m24 - m23 * m14));
            r[4] = -d * (m21 * (m33 * m44 - m43 * m34) - m31 * (m23 * m44 - m43 * m24) + m41 * (m23 * m34 - m33 * m24));
            r[5] = d * (m11 * (m33 * m44 - m43 * m34) - m31 * (m13 * m44 - m43 * m14) + m41 * (m13 * m34 - m33 * m14));
            r[6] = -d * (m11 * (m23 * m44 - m43 * m24) - m21 * (m13 * m44 - m43 * m14) + m41 * (m13 * m24 - m23 * m14));
            r[7] = d * (m11 * (m23 * m34 - m33 * m24) - m21 * (m13 * m34 - m33 * m14) + m31 * (m13 * m24 - m23 * m14));
            r[8] = d * (m21 * (m32 * m44 - m42 * m34) - m31 * (m22 * m44 - m42 * m24) + m41 * (m22 * m34 - m32 * m24));
            r[9] = -d * (m11 * (m32 * m44 - m42 * m34) - m31 * (m12 * m44 - m42 * m14) + m41 * (m12 * m34 - m32 * m14));
            r[10] = d * (m11 * (m22 * m44 - m42 * m24) - m21 * (m12 * m44 - m42 * m14) + m41 * (m12 * m24 - m22 * m14));
            r[11] = -d * (m11 * (m22 * m34 - m32 * m24) - m21 * (m12 * m34 - m32 * m14) + m31 * (m12 * m24 - m22 * m14));
            r[12] = -d * (m21 * (m32 * m43 - m42 * m33) - m31 * (m22 * m43 - m42 * m23) + m41 * (m22 * m33 - m32 * m23));
            r[13] = d * (m11 * (m32 * m43 - m42 * m33) - m31 * (m12 * m43 - m42 * m13) + m41 * (m12 * m33 - m32 * m13));
            r[14] = -d * (m11 * (m22 * m43 - m42 * m23) - m21 * (m12 * m43 - m42 * m13) + m41 * (m12 * m23 - m22 * m13));
            r[15] = d * (m11 * (m22 * m33 - m32 * m23) - m21 * (m12 * m33 - m32 * m13) + m31 * (m12 * m23 - m22 * m13));
            return this;
        }

        /**
         * 通过将当前 Matrix4x4 对象与另一个 Matrix4x4 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
         * @param   rhs     个右侧矩阵，它与当前 Matrix4x4 对象相乘。
         */
        prepend(rhs: Matrix4x4)
        {
            var mat = this.clone();
            this.copyFrom(rhs);
            this.append(mat);
            return this;
        }

        /**
         * 在 Matrix4x4 对象上前置一个增量旋转。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行旋转，然后再执行其他转换。
         * @param   axis        旋转的轴或方向。常见的轴为 X_AXIS (Vector3(1,0,0))、Y_AXIS (Vector3(0,1,0)) 和 Z_AXIS (Vector3(0,0,1))。此矢量的长度应为 1。
         * @param   degrees     旋转的角度。
         * @param   pivotPoint  一个用于确定旋转中心的点。对象的默认轴点为该对象的注册点。
         */
        prependRotation(axis: Vector3, degrees: number, pivotPoint: Vector3 = new Vector3())
        {
            var rotationMat = Matrix4x4.fromAxisRotate(axis, degrees);
            this.prepend(rotationMat);
            return this;
        }

        /**
         * 在 Matrix4x4 对象上前置一个增量缩放，沿 x、y 和 z 轴改变位置。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行缩放更改，然后再执行其他转换。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        prependScale(xScale: number, yScale: number, zScale: number)
        {
            var scaleMat = Matrix4x4.fromScale(xScale, yScale, zScale);
            this.prepend(scaleMat);
            return this;
        }

        /**
         * 在 Matrix4x4 对象上前置一个增量平移，沿 x、y 和 z 轴重新定位。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行平移更改，然后再执行其他转换。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        prependTranslation(x: number, y: number, z: number)
        {
            var translationMat = Matrix4x4.fromPosition(x, y, z);
            this.prepend(translationMat);
            return this;
        }

        /**
         * X轴方向移动
         * @param distance  移动距离
         */
        moveRight(distance: number)
        {
            var direction = this.right;
            direction.scaleNumber(distance);
            this.position = this.position.addTo(direction);
            return this;
        }

        /**
         * Y轴方向移动
         * @param distance  移动距离
         */
        moveUp(distance: number)
        {
            var direction = this.up;
            direction.scaleNumber(distance);
            this.position = this.position.addTo(direction);
            return this;
        }

        /**
         * Z轴方向移动
         * @param distance  移动距离
         */
        moveForward(distance: number)
        {
            var direction = this.forward;
            direction.scaleNumber(distance);
            this.position = this.position.addTo(direction);
            return this;
        }

        /**
         * 设置转换矩阵的平移、旋转和缩放设置。
         * @param   components      一个由三个 Vector3 对象组成的矢量，这些对象将替代 Matrix4x4 对象的平移、旋转和缩放元素。
         */
        recompose(components: Vector3[])
        {
            var rx = components[1].x;
            var ry = components[1].y;
            var rz = components[1].z;

            var sx = Math.sin(rx), cx = Math.cos(rx), sy = Math.sin(ry), cy = Math.cos(ry), sz = Math.sin(rz), cz = Math.cos(rz);
            var xS = components[2].x, yS = components[2].y, zS = components[2].z;

            this.rawData = [
                cy * cz * xS, cy * sz * xS, -sy * xS, 0,
                (sx * sy * cz - cx * sz) * yS, (sx * sy * sz + cx * cz) * yS, sx * cy * yS, 0,
                (cx * sy * cz + sx * sz) * zS, (cx * sy * sz - sx * cz) * zS, cx * cy * zS, 0,
                components[0].x, components[0].y, components[0].z, 1,
            ];
            return this;
        }

        /**
         * 使用转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3 对象。
         * @return  一个包含转换后的坐标的 Vector3 对象。
         */
        transformVector(vin: Vector3, vout = new Vector3())
        {
            this.transformVector4(Vector4.fromVector3(vin, 1)).toVector3(vout);
            return vout;
        }

        /**
         * 使用转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3 对象。
         * @return  一个包含转换后的坐标的 Vector3 对象。
         */
        transformVector4(vin: Vector4, vout = new Vector4())
        {
            var x = vin.x;
            var y = vin.y;
            var z = vin.z;
            var w = vin.w;

            vout.x = x * this.rawData[0] + y * this.rawData[4] + z * this.rawData[8] + w * this.rawData[12];
            vout.y = x * this.rawData[1] + y * this.rawData[5] + z * this.rawData[9] + w * this.rawData[13];
            vout.z = x * this.rawData[2] + y * this.rawData[6] + z * this.rawData[10] + w * this.rawData[14];
            vout.w = x * this.rawData[3] + y * this.rawData[7] + z * this.rawData[11] + w * this.rawData[15];

            return vout;
        }

        /**
         * 使用转换矩阵将由数字构成的矢量从一个空间坐标转换到另一个空间坐标。
         * @param   vin     一个由多个数字组成的矢量，其中每三个数字构成一个要转换的 3D 坐标 (x,y,z)。
         * @param   vout    一个由多个数字组成的矢量，其中每三个数字构成一个已转换的 3D 坐标 (x,y,z)。
         */
        transformVectors(vin: number[], vout: number[])
        {
            var vec = new Vector3();
            for (var i = 0; i < vin.length; i += 3)
            {
                vec.init(vin[i], vin[i + 1], vin[i + 2]);
                vec = this.transformVector(vec);
                vout[i] = vec.x;
                vout[i + 1] = vec.y;
                vout[i + 2] = vec.z;
            }
        }

        transformRotation(vin: Vector3, vout?: Vector3)
        {
            //转换旋转
            var rotationMatrix3d = Matrix4x4.fromRotation(vin.x, vin.y, vin.z);
            rotationMatrix3d.append(this);
            var newrotation = rotationMatrix3d.decompose()[1];
            newrotation.scaleNumber(180 / Math.PI);
            var v = Math.round((newrotation.x - vin.x) / 180);
            if (v % 2 != 0)
            {
                newrotation.x += 180;
                newrotation.y = 180 - newrotation.y;
                newrotation.z += 180;
            }
            //
            var toRound = (a: number, b: number, c = 360) =>
            {
                return Math.round((b - a) / c) * c + a;
            }
            newrotation.x = toRound(newrotation.x, vin.x);
            newrotation.y = toRound(newrotation.y, vin.y);
            newrotation.z = toRound(newrotation.z, vin.z);
            //
            vout = vout || new Vector3();
            vout.x = newrotation.x;
            vout.y = newrotation.y;
            vout.z = newrotation.z;
            return vout;
        }

        /**
         * 将当前 Matrix4x4 对象转换为一个矩阵，并将互换其中的行和列。
         */
        transpose()
        {
            var swap;
            for (var i = 0; i < 4; i++)
            {
                for (var j = 0; j < 4; j++)
                {
                    if (i > j)
                    {
                        swap = this.rawData[i * 4 + j];
                        this.rawData[i * 4 + j] = this.rawData[j * 4 + i];
                        this.rawData[j * 4 + i] = swap;
                    }
                }
            }
            return this;
        }

        /**
         * 比较矩阵是否相等
         */
        equals(matrix3D: Matrix4x4, precision = FMath.PRECISION)
        {
            var r2 = matrix3D.rawData;
            for (var i = 0; i < 16; ++i)
            {
                if (!FMath.equals(this.rawData[i] - r2[i], 0, precision))
                    return false;
            }

            return true;
        }

        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target: Vector3, upAxis?: Vector3): void
        {
            //获取位移，缩放，在变换过程位移与缩放不变
            var vec = this.decompose();
            var position = vec[0];
            var scale = vec[2];

            //
            var xAxis: Vector3 = new Vector3();
            var yAxis: Vector3 = new Vector3();
            var zAxis: Vector3 = new Vector3();

            upAxis = upAxis || Vector3.Y_AXIS;

            zAxis.x = target.x - this.position.x;
            zAxis.y = target.y - this.position.y;
            zAxis.z = target.z - this.position.z;
            zAxis.normalize();

            xAxis.x = upAxis.y * zAxis.z - upAxis.z * zAxis.y;
            xAxis.y = upAxis.z * zAxis.x - upAxis.x * zAxis.z;
            xAxis.z = upAxis.x * zAxis.y - upAxis.y * zAxis.x;
            xAxis.normalize();

            if (xAxis.length < .05)
            {
                xAxis.x = upAxis.y;
                xAxis.y = upAxis.x;
                xAxis.z = 0;
                xAxis.normalize();
            }

            yAxis.x = zAxis.y * xAxis.z - zAxis.z * xAxis.y;
            yAxis.y = zAxis.z * xAxis.x - zAxis.x * xAxis.z;
            yAxis.z = zAxis.x * xAxis.y - zAxis.y * xAxis.x;

            this.rawData[0] = scale.x * xAxis.x;
            this.rawData[1] = scale.x * xAxis.y;
            this.rawData[2] = scale.x * xAxis.z;
            this.rawData[3] = 0;

            this.rawData[4] = scale.y * yAxis.x;
            this.rawData[5] = scale.y * yAxis.y;
            this.rawData[6] = scale.y * yAxis.z;
            this.rawData[7] = 0;

            this.rawData[8] = scale.z * zAxis.x;
            this.rawData[9] = scale.z * zAxis.y;
            this.rawData[10] = scale.z * zAxis.z;
            this.rawData[11] = 0;

            this.rawData[12] = position.x;
            this.rawData[13] = position.y;
            this.rawData[14] = position.z;
            this.rawData[15] = 1;
        }

        /**
         * 获取XYZ轴中最大缩放值
         */
        getMaxScaleOnAxis()
        {
            var te = this.rawData;
            var scaleXSq = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
            var scaleYSq = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
            var scaleZSq = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];
            return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
        }

        /**
         * 初始化正射投影矩阵
         * @param left 可视空间左边界
         * @param right 可视空间右边界
         * @param top 可视空间上边界
         * @param bottom 可视空间下边界
         * @param near 可视空间近边界
         * @param far 可视空间远边界
         * 
         * 可视空间的八个顶点分别被投影到立方体 [(-1, -1, -1), (1, 1, 1)] 八个顶点上
         * 
         * 将长方体 [(left, bottom, near), (right, top, far)] 投影至立方体 [(-1, -1, -1), (1, 1, 1)] 中
         */
        setOrtho(left: number, right: number, top: number, bottom: number, near: number, far: number)
        {
            var r = this.rawData;

            r[0] = 2 / (right - left); r[4] = 0; /**/             r[8] = 0; /**/            r[12] = -(right + left) / (right - left);// 
            r[1] = 0; /**/             r[5] = 2 / (top - bottom); r[9] = 0;/**/             r[13] = -(top + bottom) / (top - bottom);// 
            r[2] = 0; /**/             r[6] = 0; /**/             r[10] = 2 / (far - near); r[14] = -(far + near) / (far - near);//
            r[3] = 0; /**/             r[7] = 0; /**/             r[11] = 0; /**/           r[15] = 1;//

            return this;
        }

        /**
         * 初始化透视投影矩阵
         * @param fov 垂直视角，视锥体顶面和底面间的夹角，必须大于0 （角度）
         * @param aspect 近裁剪面的宽高比
         * @param near 视锥体近边界
         * @param far 视锥体远边界
         * 
         * 视锥体的八个顶点分别被投影到立方体 [(-1, -1, -1), (1, 1, 1)] 八个顶点上
         */
        setPerspectiveFromFOV(fov: number, aspect: number, near: number, far: number)
        {
            var r = this.rawData;

            var tanfov2 = Math.tan(fov * Math.PI / 360);

            r[0] = 1 / (aspect * tanfov2); r[4] = 0; /**/      r[8] = 0; /**/                       r[12] = 0;// 
            r[1] = 0; /**/                 r[5] = 1 / tanfov2; r[9] = 0;/**/                        r[13] = 0;// 
            r[2] = 0; /**/                 r[6] = 0; /**/      r[10] = (far + near) / (far - near); r[14] = -2 * (far * near) / (far - near);//
            r[3] = 0; /**/                 r[7] = 0; /**/      r[11] = 1; /**/                      r[15] = 0;//

            return this;
        }

        /**
         * 初始化透视投影矩阵
         * @param left 可视空间左边界
         * @param right 可视空间右边界
         * @param top 可视空间上边界
         * @param bottom 可视空间下边界
         * @param near 可视空间近边界
         * @param far 可视空间远边界
         * 
         * 可视空间的八个顶点分别被投影到立方体 [(-1, -1, -1), (1, 1, 1)] 八个顶点上
         * 
         * 将长方体 [(left, bottom, near), (right, top, far)] 投影至立方体 [(-1, -1, -1), (1, 1, 1)] 中
         */
        setPerspective(left: number, right: number, top: number, bottom: number, near: number, far: number)
        {
            var r = this.rawData;

            r[0] = 2 * near / (right - left); r[4] = 0; /**/     r[8] = 0; /**/                       r[12] = 0;// 
            r[1] = 0; /**/       r[5] = 2 * near / (top - bottom); r[9] = 0;/**/                        r[13] = 0;// 
            r[2] = 0; /**/       r[6] = 0; /**/     r[10] = (far + near) / (far - near); r[14] = -2 * (far * near) / (far - near);//
            r[3] = 0; /**/       r[7] = 0; /**/     r[11] = 1; /**/                      r[15] = 0;//

            return this;
        }

        /**
         * 以字符串返回矩阵的值
         */
        toString(): string
        {
            return "Matrix4x4 [" + this.rawData.toString() + "]";
        }
    }
}