namespace feng3d
{
    type NmberArray16 = [
        number, number, number, number,
        number, number, number, number,
        number, number, number, number,
        number, number, number, number,
    ];

    /**
     * Matrix4x4 类表示一个转换矩阵，该矩阵确定三维 (3D) 显示对象的位置和方向。
     * 该矩阵可以执行转换功能，包括平移（沿 x、y 和 z 轴重新定位）、旋转和缩放（调整大小）。
     * Matrix4x4 类还可以执行透视投影，这会将 3D 坐标空间中的点映射到二维 (2D) 视图。
     * ```
     *  ---                                   ---
     *  |   scaleX      0         0       0     |   x轴
     *  |     0       scaleY      0       0     |   y轴
     *  |     0         0       scaleZ    0     |   z轴
     *  |     tx        ty        tz      1     |   平移
     *  ---                                   ---
     * 
     *  ---                                   ---
     *  |     0         1         2        3    |   x轴
     *  |     4         5         6        7    |   y轴
     *  |     8         9         10       11   |   z轴
     *  |     12        13        14       15   |   平移
     *  ---                                   ---
     * ```
     * 
     * @see https://help.adobe.com/zh_CN/FlashPlatform/reference/actionscript/3/flash/geom/Matrix3D.html
     * @see https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
     * @see https://docs.unity3d.com/ScriptReference/Matrix4x4.html
     */
    export class Matrix4x4
    {
        /**
         * 通过位移旋转缩放重组矩阵
         * 
         * @param position 位移
         * @param rotation 旋转角度，按照指定旋转顺序旋转角度。
         * @param scale 缩放。
         * @param order 旋转顺序。
         */
        static fromTRS(position: Vector3, rotation: Vector3, scale: Vector3, order = defaultRotationOrder)
        {
            return new Matrix4x4().fromTRS(position, rotation, scale, order);
        }

        /**
         * 从轴与旋转角度创建矩阵
         * 
         * @param   axis            旋转轴
         * @param   degrees         角度
         */
        static fromAxisRotate(axis: Vector3, degrees: number)
        {
            return new Matrix4x4().fromAxisRotate(axis, degrees);
        }

        /**
         * 从欧拉角旋转角度初始化矩阵。
         * 
         * @param   rx      用于沿 x 轴旋转对象的角度。
         * @param   ry      用于沿 y 轴旋转对象的角度。
         * @param   rz      用于沿 z 轴旋转对象的角度。  
         * @param   order   绕轴旋转的顺序。
         */
        static fromRotation(rx: number, ry: number, rz: number, order = defaultRotationOrder): Matrix4x4
        {
            return new Matrix4x4().fromRotation(rx, ry, rz, order);
        }

        /**
         * 从四元素初始化矩阵。
         * 
         * @param q 四元素
         */
        static fromQuaternion(q: Quaternion)
        {
            return new Matrix4x4().fromQuaternion(q);
        }

        /**
         * 创建缩放矩阵
         * @param   sx      用于沿 x 轴缩放对象的乘数。
         * @param   sy      用于沿 y 轴缩放对象的乘数。
         * @param   sz      用于沿 z 轴缩放对象的乘数。
         */
        static fromScale(sx: number, sy: number, sz: number)
        {
            var rotationMat = new Matrix4x4([//
                sx, 0., 0., 0,//
                0., sy, 0., 0,//
                0., 0., sz, 0,//
                0., 0., 0., 1//
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
         * 一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        @serialize
        elements: NmberArray16;

        /**
         * 获取位移
         * 
         * @param value 用于存储位移信息的向量
         */
        getPosition(value = new Vector3())
        {
            value.x = this.elements[12];
            value.y = this.elements[13];
            value.z = this.elements[14];
            return value;
        }

        /**
         * 设置位移
         * 
         * @param value 位移
         */
        setPosition(value: Vector3)
        {
            this.elements[12] = value.x;
            this.elements[13] = value.y;
            this.elements[14] = value.z;
            return this;
        }

        /**
         * 获取欧拉旋转角度。
         * 
         * @param rotation 欧拉旋转角度。
         * @param order   绕轴旋转的顺序。
         */
        getRotation(rotation = new Vector3(), order = defaultRotationOrder)
        {
            this.toTRS(new Vector3(), rotation, new Vector3(), order);
            return rotation;
        }

        /**
         * 设置欧拉旋转角度。
         * 
         * @param rotation 欧拉旋转角度。
         * @param order 绕轴旋转的顺序。
         */
        setRotation(rotation: Vector3, order = defaultRotationOrder)
        {
            var p = new Vector3();
            var r = new Vector3();
            var s = new Vector3();
            this.toTRS(p, r, s, order);
            r.copy(rotation);
            this.fromTRS(p, r, s);
            return this;
        }

        /**
         * 获取缩放值。
         * 
         * @param scale 用于存储缩放值的向量。
         */
        getScale(scale = new Vector3)
        {
            var rawData = this.elements;
            var v = new Vector3();
            scale.x = v.set(rawData[0], rawData[1], rawData[2]).length;
            scale.y = v.set(rawData[4], rawData[5], rawData[6]).length;
            scale.z = v.set(rawData[8], rawData[9], rawData[10]).length;
            return scale;
        }

        /**
         * 获取缩放值。
         * 
         * @param scale 缩放值。
         */
        setScale(scale: Vector3)
        {
            var oldS = this.getScale();

            var te = this.elements;
            var sx = scale.x / oldS.x;
            var sy = scale.y / oldS.y;
            var sz = scale.z / oldS.z;

            te[0] *= sx;
            te[1] *= sx;
            te[2] *= sx;
            te[4] *= sy;
            te[5] *= sy;
            te[6] *= sy;
            te[8] *= sz;
            te[9] *= sz;
            te[10] *= sz;

            return this;
        }

        /**
         * 一个用于确定矩阵是否可逆的数字。如果值为0则不可逆。
         */
        get determinant()
        {
            return (//
                (this.elements[0] * this.elements[5] - this.elements[4] * this.elements[1]) * (this.elements[10] * this.elements[15] - this.elements[14] * this.elements[11]) //
                - (this.elements[0] * this.elements[9] - this.elements[8] * this.elements[1]) * (this.elements[6] * this.elements[15] - this.elements[14] * this.elements[7]) //
                + (this.elements[0] * this.elements[13] - this.elements[12] * this.elements[1]) * (this.elements[6] * this.elements[11] - this.elements[10] * this.elements[7]) //
                + (this.elements[4] * this.elements[9] - this.elements[8] * this.elements[5]) * (this.elements[2] * this.elements[15] - this.elements[14] * this.elements[3]) //
                - (this.elements[4] * this.elements[13] - this.elements[12] * this.elements[5]) * (this.elements[2] * this.elements[11] - this.elements[10] * this.elements[3]) //
                + (this.elements[8] * this.elements[13] - this.elements[12] * this.elements[9]) * (this.elements[2] * this.elements[7] - this.elements[6] * this.elements[3])//
            );
        }

        /**
         * 获取X轴向量
         * 
         * @param out 保存X轴向量
         */
        getAxisX(out = new Vector3())
        {
            return out.set(this.elements[0], this.elements[1], this.elements[2]);
        }

        /**
         * 设置X轴向量
         * 
         * @param vector X轴向量
         */
        setAxisX(vector = new Vector3())
        {
            this.elements[0] = vector.x;
            this.elements[1] = vector.y;
            this.elements[2] = vector.z;
            return this;
        }

        /**
         * 获取Y轴向量
         * 
         * @param out 保存Y轴向量
         */
        getAxisY(out = new Vector3())
        {
            return out.set(this.elements[4], this.elements[5], this.elements[6]);
        }

        /**
         * 设置Y轴向量
         * 
         * @param vector X轴向量
         */
        setAxisY(vector = new Vector3())
        {
            this.elements[4] = vector.x;
            this.elements[5] = vector.y;
            this.elements[6] = vector.z;
            return this;
        }

        /**
         * 获取Z轴向量
         * 
         * @param out 保存Z轴向量
         */
        getAxisZ(out = new Vector3())
        {
            return out.set(this.elements[8], this.elements[9], this.elements[10]);
        }

        /**
         * 创建 Matrix4x4 对象。
         * @param   rawData    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        constructor(rawData: NmberArray16 = [
            1, 0, 0, 0,//
            0, 1, 0, 0,//
            0, 0, 1, 0,//
            0, 0, 0, 1,//
        ])
        {
            this.elements = rawData;
        }

        /**
         * 从欧拉角旋转角度初始化矩阵。
         * 
         * @param   rx      用于沿 x 轴旋转对象的角度。
         * @param   ry      用于沿 y 轴旋转对象的角度。
         * @param   rz      用于沿 z 轴旋转对象的角度。  
         * @param   order   绕轴旋转的顺序。
         */
        fromRotation(rx: number, ry: number, rz: number, order = defaultRotationOrder)
        {
            this.fromTRS(new Vector3(), new Vector3(rx, ry, rz), new Vector3(1, 1, 1), order);
            return this;
        }

        /**
         * 从四元素初始化矩阵。
         * 
         * @param q 四元素
         */
        fromQuaternion(q: Quaternion)
        {
            q.toMatrix(this);
            return this;
        }

        /**
         * 从轴与旋转角度创建矩阵
         * 
         * @param   axis            旋转轴
         * @param   degrees         角度
         */
        fromAxisRotate(axis: Vector3, degrees: number)
        {
            var n = axis.clone();
            n.normalize();
            var q = degrees * Math.PI / 180;

            var sinq = Math.sin(q);
            var cosq = Math.cos(q);
            var lcosq = 1 - cosq;

            var arr = [//
                n.x * n.x * lcosq + cosq, n.x * n.y * lcosq + n.z * sinq, n.x * n.z * lcosq - n.y * sinq, 0,//
                n.x * n.y * lcosq - n.z * sinq, n.y * n.y * lcosq + cosq, n.y * n.z * lcosq + n.x * sinq, 0,//
                n.x * n.z * lcosq + n.y * sinq, n.y * n.z * lcosq - n.x * sinq, n.z * n.z * lcosq + cosq, 0,//
                0, 0, 0, 1//
            ];

            arr.forEach((v, i) =>
            {
                this.elements[i] = v;
            });
            return this;
        }

        /**
         * 通过将另一个 Matrix4x4 对象与当前 Matrix4x4 对象相乘来后置一个矩阵。
         */
        append(lhs: Matrix4x4)
        {
            var //
                m111 = this.elements[0], m121 = this.elements[4], m131 = this.elements[8], m141 = this.elements[12],//
                m112 = this.elements[1], m122 = this.elements[5], m132 = this.elements[9], m142 = this.elements[13],//
                m113 = this.elements[2], m123 = this.elements[6], m133 = this.elements[10], m143 = this.elements[14],//
                m114 = this.elements[3], m124 = this.elements[7], m134 = this.elements[11], m144 = this.elements[15], //

                m211 = lhs.elements[0], m221 = lhs.elements[4], m231 = lhs.elements[8], m241 = lhs.elements[12], //
                m212 = lhs.elements[1], m222 = lhs.elements[5], m232 = lhs.elements[9], m242 = lhs.elements[13], //
                m213 = lhs.elements[2], m223 = lhs.elements[6], m233 = lhs.elements[10], m243 = lhs.elements[14], //
                m214 = lhs.elements[3], m224 = lhs.elements[7], m234 = lhs.elements[11], m244 = lhs.elements[15];

            this.elements[0] = m111 * m211 + m112 * m221 + m113 * m231 + m114 * m241;
            this.elements[1] = m111 * m212 + m112 * m222 + m113 * m232 + m114 * m242;
            this.elements[2] = m111 * m213 + m112 * m223 + m113 * m233 + m114 * m243;
            this.elements[3] = m111 * m214 + m112 * m224 + m113 * m234 + m114 * m244;

            this.elements[4] = m121 * m211 + m122 * m221 + m123 * m231 + m124 * m241;
            this.elements[5] = m121 * m212 + m122 * m222 + m123 * m232 + m124 * m242;
            this.elements[6] = m121 * m213 + m122 * m223 + m123 * m233 + m124 * m243;
            this.elements[7] = m121 * m214 + m122 * m224 + m123 * m234 + m124 * m244;

            this.elements[8] = m131 * m211 + m132 * m221 + m133 * m231 + m134 * m241;
            this.elements[9] = m131 * m212 + m132 * m222 + m133 * m232 + m134 * m242;
            this.elements[10] = m131 * m213 + m132 * m223 + m133 * m233 + m134 * m243;
            this.elements[11] = m131 * m214 + m132 * m224 + m133 * m234 + m134 * m244;

            this.elements[12] = m141 * m211 + m142 * m221 + m143 * m231 + m144 * m241;
            this.elements[13] = m141 * m212 + m142 * m222 + m143 * m232 + m144 * m242;
            this.elements[14] = m141 * m213 + m142 * m223 + m143 * m233 + m144 * m243;
            this.elements[15] = m141 * m214 + m142 * m224 + m143 * m234 + m144 * m244;

            console.assert(this.elements[0] !== NaN && this.elements[4] !== NaN && this.elements[8] !== NaN && this.elements[12] !== NaN);

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
         * @param   sx      用于沿 x 轴缩放对象的乘数。
         * @param   sy      用于沿 y 轴缩放对象的乘数。
         * @param   sz      用于沿 z 轴缩放对象的乘数。
         */
        appendScale(sx: number, sy: number, sz: number)
        {
            var scaleMat = Matrix4x4.fromScale(sx, sy, sz);
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
            const m = this.elements;
            m[0] += x * m[3]; m[4] += x * m[7]; m[8] += x * m[11]; m[12] += x * m[15];
            m[1] += y * m[3]; m[5] += y * m[7]; m[9] += y * m[11]; m[13] += y * m[15];
            m[2] += z * m[3]; m[6] += z * m[7]; m[10] += z * m[11]; m[14] += z * m[15];
            return this;
        }

        /**
         * 返回一个新 Matrix4x4 对象，它是与当前 Matrix4x4 对象完全相同的副本。
         */
        clone()
        {
            var matrix = new Matrix4x4();
            matrix.copy(this);
            return matrix;
        }

        /**
         * 将源 Matrix4x4 对象中的所有矩阵数据复制到调用方 Matrix4x4 对象中。
         * @param   source      要从中复制数据的 Matrix4x4 对象。
         */
        copy(source: Matrix4x4)
        {
            for (var i = 0; i < 16; i++)
            {
                this.elements[i] = source.elements[i];
            }
            return this;
        }

        /**
         * 从数组中初始化
         * 
         * @param   array       包含矩阵数据的数组
         * @param   index       数组中的起始位置
         * @param   transpose   是否转置
         */
        fromArray(array: number[], index = 0, transpose = false)
        {
            if (array.length - index < 16)
            {
                throw new Error("vector参数数据长度不够！");
            }
            for (var i = 0; i < 16; i++)
            {
                this.elements[i] = array[index + i];
            }
            if (transpose)
            {
                this.transpose();
            }
            return this;
        }

        /**
         * 将矩阵数据转换为数组
         * 
         * @param   array       保存矩阵数据的数组
         * @param   index       数组中的起始位置
         * @param   transpose   是否转置
         */
        toArray(array: number[] | Float32Array = [], index = 0, transpose = false)
        {
            if (transpose)
            {
                this.transpose();
            }
            for (var i = 0; i < 16; i++)
            {
                array[i + index] = this.elements[i];
            }
            if (transpose)
            {
                this.transpose();
            }
            return array;
        }

        /**
         * 通过位移旋转缩放重组矩阵
         * 
         * @param position 位移
         * @param rotation 旋转角度，按照指定旋转顺序旋转角度。
         * @param scale 缩放。
         * @param order 旋转顺序。
         */
        fromTRS(position: Vector3, rotation: Vector3, scale: Vector3, order = defaultRotationOrder)
        {
            var m = this.elements;
            //
            m[11] = 0;
            m[15] = 1;
            //
            rotation = rotation.scaleNumberTo(Math.DEG2RAD);
            var px = position.x;
            var py = position.y;
            var pz = position.z;
            var rx = rotation.x;
            var ry = rotation.y;
            var rz = rotation.z;
            var sx = scale.x;
            var sy = scale.y;
            var sz = scale.z;
            //
            m[12] = px;
            m[13] = py;
            m[14] = pz;
            //
            var cosX = Math.cos(rx), sinX = Math.sin(rx);
            var cosY = Math.cos(ry), sinY = Math.sin(ry);
            var cosZ = Math.cos(rz), sinZ = Math.sin(rz);

            if (order === RotationOrder.XYZ)
            {
                var ae = cosX * cosZ, af = cosX * sinZ, be = sinX * cosZ, bf = sinX * sinZ;

                m[0] = cosY * cosZ;
                m[4] = - cosY * sinZ;
                m[8] = sinY;

                m[1] = af + be * sinY;
                m[5] = ae - bf * sinY;
                m[9] = - sinX * cosY;

                m[2] = bf - ae * sinY;
                m[6] = be + af * sinY;
                m[10] = cosX * cosY;

            } else if (order === RotationOrder.YXZ)
            {
                var ce = cosY * cosZ, cf = cosY * sinZ, de = sinY * cosZ, df = sinY * sinZ;

                m[0] = ce + df * sinX;
                m[4] = de * sinX - cf;
                m[8] = cosX * sinY;

                m[1] = cosX * sinZ;
                m[5] = cosX * cosZ;
                m[9] = - sinX;

                m[2] = cf * sinX - de;
                m[6] = df + ce * sinX;
                m[10] = cosX * cosY;

            } else if (order === RotationOrder.ZXY)
            {
                var ce = cosY * cosZ, cf = cosY * sinZ, de = sinY * cosZ, df = sinY * sinZ;

                m[0] = ce - df * sinX;
                m[4] = - cosX * sinZ;
                m[8] = de + cf * sinX;

                m[1] = cf + de * sinX;
                m[5] = cosX * cosZ;
                m[9] = df - ce * sinX;

                m[2] = - cosX * sinY;
                m[6] = sinX;
                m[10] = cosX * cosY;

            } else if (order === RotationOrder.ZYX)
            {
                var ae = cosX * cosZ, af = cosX * sinZ, be = sinX * cosZ, bf = sinX * sinZ;

                m[0] = cosY * cosZ;
                m[4] = be * sinY - af;
                m[8] = ae * sinY + bf;

                m[1] = cosY * sinZ;
                m[5] = bf * sinY + ae;
                m[9] = af * sinY - be;

                m[2] = - sinY;
                m[6] = sinX * cosY;
                m[10] = cosX * cosY;

            } else if (order === RotationOrder.YZX)
            {
                var ac = cosX * cosY, ad = cosX * sinY, bc = sinX * cosY, bd = sinX * sinY;

                m[0] = cosY * cosZ;
                m[4] = bd - ac * sinZ;
                m[8] = bc * sinZ + ad;

                m[1] = sinZ;
                m[5] = cosX * cosZ;
                m[9] = - sinX * cosZ;

                m[2] = - sinY * cosZ;
                m[6] = ad * sinZ + bc;
                m[10] = ac - bd * sinZ;

            } else if (order === RotationOrder.XZY)
            {
                var ac = cosX * cosY, ad = cosX * sinY, bc = sinX * cosY, bd = sinX * sinY;

                m[0] = cosY * cosZ;
                m[4] = - sinZ;
                m[8] = sinY * cosZ;

                m[1] = ac * sinZ + bd;
                m[5] = cosX * cosZ;
                m[9] = ad * sinZ - bc;

                m[2] = bc * sinZ - ad;
                m[6] = sinX * cosZ;
                m[10] = bd * sinZ + ac;

            } else
            {
                console.error(`初始化矩阵时错误旋转顺序 ${order}`);
            }
            //
            m[0] *= sx;
            m[1] *= sx;
            m[2] *= sx;
            m[4] *= sy;
            m[5] *= sy;
            m[6] *= sy;
            m[8] *= sz;
            m[9] *= sz;
            m[10] *= sz;

            return this;
        }

        /**
         * 把矩阵分解为位移旋转缩放。
         * 
         * @param position 位移
         * @param rotation 旋转角度，按照指定旋转顺序旋转。
         * @param scale 缩放。
         * @param order 旋转顺序。
         */
        toTRS(position = new Vector3(), rotation = new Vector3(), scale = new Vector3(), order = defaultRotationOrder)
        {
            var clamp = Math.clamp;
            //
            var m = this.elements;
            var m11 = m[0], m12 = m[4], m13 = m[8];
            var m21 = m[1], m22 = m[5], m23 = m[9];
            var m31 = m[2], m32 = m[6], m33 = m[10];
            //
            position.x = m[12];
            position.y = m[13];
            position.z = m[14];
            //
            scale.x = Math.sqrt(m11 * m11 + m21 * m21 + m31 * m31);
            m11 /= scale.x;
            m21 /= scale.x;
            m31 /= scale.x;
            scale.y = Math.sqrt(m12 * m12 + m22 * m22 + m32 * m32);
            m12 /= scale.y;
            m22 /= scale.y;
            m32 /= scale.y;
            scale.z = Math.sqrt(m13 * m13 + m23 * m23 + m33 * m33);
            m13 /= scale.z;
            m23 /= scale.z;
            m33 /= scale.z;
            //
            if (order === RotationOrder.XYZ)
            {
                rotation.y = Math.asin(clamp(m13, - 1, 1));
                if (Math.abs(m13) < 0.9999999)
                {
                    rotation.x = Math.atan2(- m23, m33);
                    rotation.z = Math.atan2(- m12, m11);
                } else
                {
                    rotation.x = Math.atan2(m32, m22);
                    rotation.z = 0;
                }
            } else if (order === RotationOrder.YXZ)
            {
                rotation.x = Math.asin(- clamp(m23, - 1, 1));
                if (Math.abs(m23) < 0.9999999)
                {
                    rotation.y = Math.atan2(m13, m33);
                    rotation.z = Math.atan2(m21, m22);
                } else
                {
                    rotation.y = Math.atan2(- m31, m11);
                    rotation.z = 0;
                }
            } else if (order === RotationOrder.ZXY)
            {
                rotation.x = Math.asin(clamp(m32, - 1, 1));
                if (Math.abs(m32) < 0.9999999)
                {
                    rotation.y = Math.atan2(- m31, m33);
                    rotation.z = Math.atan2(- m12, m22);
                } else
                {
                    rotation.y = 0;
                    rotation.z = Math.atan2(m21, m11);
                }
            } else if (order === RotationOrder.ZYX)
            {
                rotation.y = Math.asin(- clamp(m31, - 1, 1));
                if (Math.abs(m31) < 0.9999999)
                {
                    rotation.x = Math.atan2(m32, m33);
                    rotation.z = Math.atan2(m21, m11);
                } else
                {
                    rotation.x = 0;
                    rotation.z = Math.atan2(- m12, m22);
                }
            } else if (order === RotationOrder.YZX)
            {
                rotation.z = Math.asin(clamp(m21, - 1, 1));
                if (Math.abs(m21) < 0.9999999)
                {
                    rotation.x = Math.atan2(- m23, m22);
                    rotation.y = Math.atan2(- m31, m11);
                } else
                {
                    rotation.x = 0;
                    rotation.y = Math.atan2(m13, m33);
                }
            } else if (order === RotationOrder.XZY)
            {
                rotation.z = Math.asin(- clamp(m12, - 1, 1));
                if (Math.abs(m12) < 0.9999999)
                {
                    rotation.x = Math.atan2(m32, m22);
                    rotation.y = Math.atan2(m13, m11);
                } else
                {
                    rotation.x = Math.atan2(- m23, m33);
                    rotation.y = 0;
                }
            } else
            {
                console.error(`初始化矩阵时错误旋转顺序 ${order}`);
            }
            rotation.scaleNumber(Math.RAD2DEG);
            return [position, rotation, scale];
        }

        /**
         * 将当前矩阵转换为恒等或单位矩阵。
         */
        identity()
        {
            var m = this.elements;
            m[0] = 1; m[1] = 0; m[2] = 0; m[3] = 0;
            m[4] = 0; m[5] = 1; m[6] = 0; m[7] = 0;
            m[8] = 0; m[9] = 0; m[10] = 1; m[11] = 0;
            m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
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
                console.error("无法获取逆矩阵");
                return this;
            }
            d = 1 / d;

            var m = this.elements;

            var m11 = m[0]; var m21 = m[4]; var m31 = m[8]; var m41 = m[12];
            var m12 = m[1]; var m22 = m[5]; var m32 = m[9]; var m42 = m[13];
            var m13 = m[2]; var m23 = m[6]; var m33 = m[10]; var m43 = m[14];
            var m14 = m[3]; var m24 = m[7]; var m34 = m[11]; var m44 = m[15];

            m[0] = d * (m22 * (m33 * m44 - m43 * m34) - m32 * (m23 * m44 - m43 * m24) + m42 * (m23 * m34 - m33 * m24));
            m[1] = -d * (m12 * (m33 * m44 - m43 * m34) - m32 * (m13 * m44 - m43 * m14) + m42 * (m13 * m34 - m33 * m14));
            m[2] = d * (m12 * (m23 * m44 - m43 * m24) - m22 * (m13 * m44 - m43 * m14) + m42 * (m13 * m24 - m23 * m14));
            m[3] = -d * (m12 * (m23 * m34 - m33 * m24) - m22 * (m13 * m34 - m33 * m14) + m32 * (m13 * m24 - m23 * m14));
            m[4] = -d * (m21 * (m33 * m44 - m43 * m34) - m31 * (m23 * m44 - m43 * m24) + m41 * (m23 * m34 - m33 * m24));
            m[5] = d * (m11 * (m33 * m44 - m43 * m34) - m31 * (m13 * m44 - m43 * m14) + m41 * (m13 * m34 - m33 * m14));
            m[6] = -d * (m11 * (m23 * m44 - m43 * m24) - m21 * (m13 * m44 - m43 * m14) + m41 * (m13 * m24 - m23 * m14));
            m[7] = d * (m11 * (m23 * m34 - m33 * m24) - m21 * (m13 * m34 - m33 * m14) + m31 * (m13 * m24 - m23 * m14));
            m[8] = d * (m21 * (m32 * m44 - m42 * m34) - m31 * (m22 * m44 - m42 * m24) + m41 * (m22 * m34 - m32 * m24));
            m[9] = -d * (m11 * (m32 * m44 - m42 * m34) - m31 * (m12 * m44 - m42 * m14) + m41 * (m12 * m34 - m32 * m14));
            m[10] = d * (m11 * (m22 * m44 - m42 * m24) - m21 * (m12 * m44 - m42 * m14) + m41 * (m12 * m24 - m22 * m14));
            m[11] = -d * (m11 * (m22 * m34 - m32 * m24) - m21 * (m12 * m34 - m32 * m14) + m31 * (m12 * m24 - m22 * m14));
            m[12] = -d * (m21 * (m32 * m43 - m42 * m33) - m31 * (m22 * m43 - m42 * m23) + m41 * (m22 * m33 - m32 * m23));
            m[13] = d * (m11 * (m32 * m43 - m42 * m33) - m31 * (m12 * m43 - m42 * m13) + m41 * (m12 * m33 - m32 * m13));
            m[14] = -d * (m11 * (m22 * m43 - m42 * m23) - m21 * (m12 * m43 - m42 * m13) + m41 * (m12 * m23 - m22 * m13));
            m[15] = d * (m11 * (m22 * m33 - m32 * m23) - m21 * (m12 * m33 - m32 * m13) + m31 * (m12 * m23 - m22 * m13));
            return this;
        }

        /**
         * 通过将当前 Matrix4x4 对象与另一个 Matrix4x4 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
         * @param   rhs     个右侧矩阵，它与当前 Matrix4x4 对象相乘。
         */
        prepend(rhs: Matrix4x4)
        {
            var mat = this.clone();
            this.copy(rhs);
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

        prependScale1(xScale: number, yScale: number, zScale: number)
        {
            var m = this.elements;
            m[0] *= xScale;
            m[1] *= xScale;
            m[2] *= xScale;
            m[4] *= yScale;
            m[5] *= yScale;
            m[6] *= yScale;
            m[8] *= zScale;
            m[9] *= zScale;
            m[10] *= zScale;

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
            var direction = this.getAxisX();
            direction.normalize(distance);
            this.setPosition(this.getPosition().addTo(direction));
            return this;
        }

        /**
         * Y轴方向移动
         * @param distance  移动距离
         */
        moveUp(distance: number)
        {
            var direction = this.getAxisY();
            direction.scaleNumber(distance);
            this.setPosition(this.getPosition().addTo(direction));
            return this;
        }

        /**
         * Z轴方向移动
         * @param distance  移动距离
         */
        moveForward(distance: number)
        {
            var direction = this.getAxisZ();
            direction.scaleNumber(distance);
            this.setPosition(this.getPosition().addTo(direction));
            return this;
        }

        /**
         * 使用转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3 对象。
         * @return  一个包含转换后的坐标的 Vector3 对象。
         */
        transformPoint3(vin: Vector3, vout = new Vector3())
        {
            var m = this.elements;
            var m0 = m[0], m1 = m[1], m2 = m[2];
            var m4 = m[4], m5 = m[5], m6 = m[6];
            var m8 = m[8], m9 = m[9], m10 = m[10];
            var m12 = m[12], m13 = m[13], m14 = m[14];

            var x = vin.x;
            var y = vin.y;
            var z = vin.z;

            vout.x = x * m0 + y * m4 + z * m8 + m12;
            vout.y = x * m1 + y * m5 + z * m9 + m13;
            vout.z = x * m2 + y * m6 + z * m10 + m14;

            return vout;
        }

        /**
         * 变换Vector3向量
         * 
         * 与变换点不同，并不会受到矩阵平移分量的影响。
         * 
         * @param vin   被变换的向量
         * @param vout  变换后的向量
         */
        transformVector3(vin: Vector3, vout = new Vector3())
        {
            var m = this.elements;
            var m0 = m[0], m1 = m[1], m2 = m[2];
            var m4 = m[4], m5 = m[5], m6 = m[6];
            var m8 = m[8], m9 = m[9], m10 = m[10];

            var x = vin.x;
            var y = vin.y;
            var z = vin.z;

            vout.x = x * m0 + y * m4 + z * m8;
            vout.y = x * m1 + y * m5 + z * m9;
            vout.z = x * m2 + y * m6 + z * m10;

            return vout;
        }

        /**
         * 变换Vector4向量
         * 
         * @param vin   被变换的向量
         * @param vout  变换后的向量
         */
        transformVector4(vin: Vector4, vout = new Vector4())
        {
            var m = this.elements;
            var m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3];
            var m4 = m[4], m5 = m[5], m6 = m[6], m7 = m[7];
            var m8 = m[8], m9 = m[9], m10 = m[10], m11 = m[11];
            var m12 = m[12], m13 = m[13], m14 = m[14], m15 = m[15];

            var x = vin.x;
            var y = vin.y;
            var z = vin.z;
            var w = vin.w;

            vout.x = x * m0 + y * m4 + z * m8 + w * m12;
            vout.y = x * m1 + y * m5 + z * m9 + w * m13;
            vout.z = x * m2 + y * m6 + z * m10 + w * m14;
            vout.w = x * m3 + y * m7 + z * m11 + w * m15;

            return vout;
        }

        /**
         * 变换坐标数组数据
         * 
         * @param   vin     被变换坐标数组数据
         * @param   vout    变换后的坐标数组数据
         */
        transformPoints(vin: number[], vout: number[] = [])
        {
            var m = this.elements;
            var m0 = m[0], m1 = m[1], m2 = m[2];
            var m4 = m[4], m5 = m[5], m6 = m[6];
            var m8 = m[8], m9 = m[9], m10 = m[10];
            var m12 = m[12], m13 = m[13], m14 = m[14];

            for (var i = 0; i < vin.length; i += 3)
            {
                var x = vin[i];
                var y = vin[i + 1];
                var z = vin[i + 2];

                vout[i] = x * m0 + y * m4 + z * m8 + m12;
                vout[i + 1] = x * m1 + y * m5 + z * m9 + m13;
                vout[i + 2] = x * m2 + y * m6 + z * m10 + m14;
            }
            return vout;
        }

        /**
         * 变换旋转角度
         * 
         * @param vin   被变换的旋转角度
         * @param vout  变换后的旋转角度
         */
        transformRotation(vin: Vector3, vout = new Vector3())
        {
            //转换旋转
            var rotationMatrix = Matrix4x4.fromRotation(vin.x, vin.y, vin.z);
            rotationMatrix.append(this);
            var newrotation = rotationMatrix.toTRS()[1];
            var rx = newrotation.x, ry = newrotation.y, rz = newrotation.z;
            var v = Math.round((rx - vin.x) / 180);
            if (v % 2 != 0)
            {
                rx += 180;
                ry = 180 - ry;
                rz += 180;
            }
            //
            var toRound = (a: number, b: number, c = 360) =>
            {
                return Math.round((b - a) / c) * c + a;
            }
            rx = toRound(rx, vin.x);
            ry = toRound(ry, vin.y);
            rz = toRound(rz, vin.z);
            //
            vout.x = rx;
            vout.y = ry;
            vout.z = rz;
            return vout;
        }

        /**
         * 使用转换矩阵将 Ray3 对象从一个空间坐标转换到另一个空间坐标。
         * 
         * @param inRay 被转换的Ray3。
         * @param outRay 转换后的Ray3。
         * @returns 转换后的Ray3。
         */
        transformRay(inRay: Ray3, outRay = new Ray3())
        {
            this.transformPoint3(inRay.origin, outRay.origin);
            this.transformVector3(inRay.direction, outRay.direction);
            return outRay;
        }

        /**
         * 将当前 Matrix4x4 对象转换为一个矩阵，并将互换其中的行和列。
         */
        transpose()
        {
            const m = this.elements;
            let tmp: number;

            tmp = m[1]; m[1] = m[4]; m[4] = tmp;
            tmp = m[2]; m[2] = m[8]; m[8] = tmp;
            tmp = m[6]; m[6] = m[9]; m[9] = tmp;

            tmp = m[3]; m[3] = m[12]; m[12] = tmp;
            tmp = m[7]; m[7] = m[13]; m[13] = tmp;
            tmp = m[11]; m[11] = m[14]; m[14] = tmp;
            return this;
        }

        /**
         * 比较矩阵是否相等
         */
        equals(matrix: Matrix4x4, precision = Math.PRECISION)
        {
            var r2 = matrix.elements;
            for (var i = 0; i < 16; ++i)
            {
                if (!Math.equals(this.elements[i] - r2[i], 0, precision))
                    return false;
            }

            return true;
        }

        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target: Vector3, upAxis?: Vector3)
        {
            //获取位移，缩放，在变换过程位移与缩放不变
            var vec = this.toTRS();
            var position = vec[0];
            var scale = vec[2];

            //
            var xAxis = new Vector3();
            var yAxis = new Vector3();
            var zAxis = new Vector3();

            upAxis = upAxis || Vector3.Y_AXIS;

            zAxis.x = target.x - position.x;
            zAxis.y = target.y - position.y;
            zAxis.z = target.z - position.z;
            zAxis.normalize();

            xAxis.x = upAxis.y * zAxis.z - upAxis.z * zAxis.y;
            xAxis.y = upAxis.z * zAxis.x - upAxis.x * zAxis.z;
            xAxis.z = upAxis.x * zAxis.y - upAxis.y * zAxis.x;
            xAxis.normalize();

            if (xAxis.lengthSquared < .005)
            {
                xAxis.x = upAxis.y;
                xAxis.y = upAxis.x;
                xAxis.z = 0;
                xAxis.normalize();
            }

            yAxis.x = zAxis.y * xAxis.z - zAxis.z * xAxis.y;
            yAxis.y = zAxis.z * xAxis.x - zAxis.x * xAxis.z;
            yAxis.z = zAxis.x * xAxis.y - zAxis.y * xAxis.x;

            this.elements[0] = scale.x * xAxis.x;
            this.elements[1] = scale.x * xAxis.y;
            this.elements[2] = scale.x * xAxis.z;
            this.elements[3] = 0;

            this.elements[4] = scale.y * yAxis.x;
            this.elements[5] = scale.y * yAxis.y;
            this.elements[6] = scale.y * yAxis.z;
            this.elements[7] = 0;

            this.elements[8] = scale.z * zAxis.x;
            this.elements[9] = scale.z * zAxis.y;
            this.elements[10] = scale.z * zAxis.z;
            this.elements[11] = 0;

            this.elements[12] = position.x;
            this.elements[13] = position.y;
            this.elements[14] = position.z;
            this.elements[15] = 1;
            return this;
        }

        /**
         * 获取XYZ轴中最大缩放值
         */
        getMaxScaleOnAxis()
        {
            var m = this.elements;
            var scaleXSq = m[0] * m[0] + m[1] * m[1] + m[2] * m[2];
            var scaleYSq = m[4] * m[4] + m[5] * m[5] + m[6] * m[6];
            var scaleZSq = m[8] * m[8] + m[9] * m[9] + m[10] * m[10];
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
            var m = this.elements;

            m[0] = 2 / (right - left); m[4] = 0; /**/             m[8] = 0; /**/            m[12] = -(right + left) / (right - left);// 
            m[1] = 0; /**/             m[5] = 2 / (top - bottom); m[9] = 0;/**/             m[13] = -(top + bottom) / (top - bottom);// 
            m[2] = 0; /**/             m[6] = 0; /**/             m[10] = 2 / (far - near); m[14] = -(far + near) / (far - near);//
            m[3] = 0; /**/             m[7] = 0; /**/             m[11] = 0; /**/           m[15] = 1;//

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
            var m = this.elements;

            var tanfov2 = Math.tan(fov * Math.PI / 360);

            m[0] = 1 / (aspect * tanfov2); m[4] = 0; /**/      m[8] = 0; /**/                       m[12] = 0;// 
            m[1] = 0; /**/                 m[5] = 1 / tanfov2; m[9] = 0;/**/                        m[13] = 0;// 
            m[2] = 0; /**/                 m[6] = 0; /**/      m[10] = (far + near) / (far - near); m[14] = -2 * (far * near) / (far - near);//
            m[3] = 0; /**/                 m[7] = 0; /**/      m[11] = 1; /**/                      m[15] = 0;//

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
            var m = this.elements;

            m[0] = 2 * near / (right - left); m[4] = 0; /**/     m[8] = 0; /**/                       m[12] = 0;// 
            m[1] = 0; /**/       m[5] = 2 * near / (top - bottom); m[9] = 0;/**/                        m[13] = 0;// 
            m[2] = 0; /**/       m[6] = 0; /**/     m[10] = (far + near) / (far - near); m[14] = -2 * (far * near) / (far - near);//
            m[3] = 0; /**/       m[7] = 0; /**/     m[11] = 1; /**/                      m[15] = 0;//

            return this;
        }

        /**
         * 转换为3x3矩阵
         * 
         * @param out 3x3矩阵
         */
        toMatrix3x3(out = new Matrix3x3())
        {
            var outdata = out.elements;
            var indata = this.elements;

            outdata[0] = indata[0];
            outdata[1] = indata[1];
            outdata[2] = 0;

            outdata[3] = indata[4];
            outdata[4] = indata[5];
            outdata[5] = 0;

            outdata[6] = indata[12];
            outdata[7] = indata[13];
            outdata[8] = 1;

            return out;
        }

        /**
         * 以字符串返回矩阵的值
         */
        toString(): string
        {
            return "Matrix4x4 [" + this.elements.toString() + "]";
        }
    }
}