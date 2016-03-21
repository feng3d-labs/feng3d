module feng3d {
    /**
     * @language zh_CN
     * @class egret3d.Quaternion
     * @classdesc
     * Quaternion类
     * 
     * 定义了一个四元数表示物体在空间的旋转。
     * 四元数通常用作替代欧拉角和旋转矩阵的方式来实现平滑插值和避免万向节锁
     * 注意，这四元数类不自动保持四元数标准化。因此，在必要的时候，必须采取单位化的四元数，通过调用单位化方法
     * @version Egret 3.0
     * @platform Web,Native
     */
    export class Quaternion {

        /**
        * @language en_US
        * The x value of the quaternion.
        */
        /**
        * @language zh_CN
        * 四元数的x值.
        */
        public x: number = 0;

        /**
        * @language en_US
        * The y value of the quaternion.
        */
        /**
        * @language zh_CN
        * 四元数的y值.
        */
        public y: number = 0;

        /**
        * @language en_US
        * The z value of the quaternion.
        */
        /**
        * @language zh_CN
        * 四元数的z值.
        */
        public z: number = 0;

        /**
        * @language en_US
        * The w value of the quaternion.
        */
        /**
        * @language zh_CN
        * 四元数的w值.
        */
        public w: number = 1;

        /**
        * @language en_US
        * Creates a new Quaternion object.
        * @param x The x value of the quaternion.
        * @param y The y value of the quaternion.
        * @param z The z value of the quaternion.
        * @param w The w value of the quaternion.
        */
        /**
        * @language zh_CN
        * 创建一个四元数.
        * @param x
        * @param y
        * @param z
        * @param w
        */
        constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }

        /**
        * @language en_US
        *  
        * @returns the magnitude of the quaternion object.
        */
        /**
        * @language zh_CN
        *  
        * 返回四元数的大小.
        * @param w
        * @returns 四元数的大小.
        */
        public get magnitude(): number {
            return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
        }

        /**
        * @language en_US
        * Fills the quaternion object with the result from a multiplication of two quaternion objects.
        *
        * @param    qa    The first quaternion in the multiplication.
        * @param    qb    The second quaternion in the multiplication.
        */
        /**
        * @language zh_CN
        * 两个四元数相乘,然后结果给当调用者.
        * @param qa 第一个四元数
        * @param qb 第二个四元数
        */
        public multiply(qa: Quaternion, qb: Quaternion) {
            var w1: number = qa.w, x1: number = qa.x, y1: number = qa.y, z1: number = qa.z;
            var w2: number = qb.w, x2: number = qb.x, y2: number = qb.y, z2: number = qb.z;

            this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
            this.x = w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2;
            this.y = w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2;
            this.z = w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2;
        }

        /**
        * @language zh_CN
        * 四元数乘以一个3维向量，结果返回一个四元数
        * @param vector 相乘的向量
        * @param target 返回的结果，如果为null就会实例化一个四元数对象返回
        * @returns 返回相乘后的结果
        */
        public multiplyVector(vector: Vector3D, target: Quaternion = null): Quaternion {
            if (target === null) {
                target = new Quaternion();
            }

            var x2: number = vector.x;
            var y2: number = vector.y;
            var z2: number = vector.z;

            target.w = -this.x * x2 - this.y * y2 - this.z * z2;
            target.x = this.w * x2 + this.y * z2 - this.z * y2;
            target.y = this.w * y2 - this.x * z2 + this.z * x2;
            target.z = this.w * z2 + this.x * y2 - this.y * x2;

            return target;
        }

        /**
        * @language en_US
        * Fills the quaternion object with values representing the given rotation around a vector.
        *
        * @param    axis    The axis around which to rotate
        * @param    angle    The angle in radians of the rotation.
        */
        /**
        * @language zh_CN
        * 创建一个以axis轴为中心旋转angle角度的四元数
        *
        * @param axis   旋转轴
        * @param angle  旋转角度
        */
        public fromAxisAngle(axis: Vector3D, angle: number) {
            angle *= Math.PI / 180.0;
            var halfAngle: number = angle * 0.5;
            var sin_a: number = Math.sin(halfAngle);

            this.w = Math.cos(halfAngle);
            this.x = axis.x * sin_a;
            this.y = axis.y * sin_a;
            this.z = axis.z * sin_a;

            this.normalize();
        }

        /**
        * @language zh_CN
        * 返回四元数绕轴心和角度
        *
        * @param axis 轴心
        * @returns 角度
        */
        public toAxisAngle(axis: Vector3D): number {
            var sqrLength: number = this.x * this.x + this.y * this.y + this.z * this.z;
            var angle: number = 0;
            if (sqrLength > 0.0) {
                angle = 2.0 * Math.acos(this.w);
                sqrLength = 1.0 / Math.sqrt(sqrLength);
                axis.x = this.x * sqrLength;
                axis.y = this.y * sqrLength;
                axis.z = this.z * sqrLength;
            }
            else {
                angle = 0;
                axis.x = 1.0;
                axis.y = 0;
                axis.z = 0;
            }
            angle /= Math.PI / 180.0;
            return angle;
        }

        /**
        * @language en_US
        * Spherically interpolates between two quaternions, providing an interpolation between rotations with constant angle change rate.
        * @param qa The first quaternion to interpolate.
        * @param qb The second quaternion to interpolate.
        * @param t The interpolation weight, a value between 0 and 1.
        */
        /**
        * @language zh_CN
        * 两个四元数之间球形插值，插值之间提供旋转恒定角变化率。
        *
        * @param qa 四元数1
        * @param qb 四元数2
        * @param t 差值时刻
        */
        public slerp(qa: Quaternion, qb: Quaternion, t: number) {
            var w1: number = qa.w, x1: number = qa.x, y1: number = qa.y, z1: number = qa.z;
            var w2: number = qb.w, x2: number = qb.x, y2: number = qb.y, z2: number = qb.z;
            var dot: number = w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2;

            // shortest direction
            if (dot < 0) {
                dot = -dot;
                w2 = -w2;
                x2 = -x2;
                y2 = -y2;
                z2 = -z2;
            }

            if (dot < 0.95) {
                // interpolate angle linearly
                var angle: number = Math.acos(dot);
                var s: number = 1 / Math.sin(angle);
                var s1: number = Math.sin(angle * (1 - t)) * s;
                var s2: number = Math.sin(angle * t) * s;
                this.w = w1 * s1 + w2 * s2;
                this.x = x1 * s1 + x2 * s2;
                this.y = y1 * s1 + y2 * s2;
                this.z = z1 * s1 + z2 * s2;
            } else {
                // nearly identical angle, interpolate linearly
                this.w = w1 + t * (w2 - w1);
                this.x = x1 + t * (x2 - x1);
                this.y = y1 + t * (y2 - y1);
                this.z = z1 + t * (z2 - z1);
                var len: number = 1.0 / Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
                this.w *= len;
                this.x *= len;
                this.y *= len;
                this.z *= len;
            }
        }

        /**
        * @language en_US
        * Linearly interpolates between two quaternions.
        * @param qa The first quaternion to interpolate.
        * @param qb The second quaternion to interpolate.
        * @param t The interpolation weight, a value between 0 and 1.
        */
        /**
        * @language zh_CN
        * 两个四元数之间的线性插值
        *
        * @param qa 四元数1
        * @param qb 四元数2
        * @param t 差值时刻
        */
        public lerp(qa: Quaternion, qb: Quaternion, t: number) {
            var w1: number = qa.w, x1: number = qa.x, y1: number = qa.y, z1: number = qa.z;
            var w2: number = qb.w, x2: number = qb.x, y2: number = qb.y, z2: number = qb.z;
            var len: number;

            // shortest direction
            if (w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2 < 0) {
                w2 = -w2;
                x2 = -x2;
                y2 = -y2;
                z2 = -z2;
            }

            this.w = w1 + t * (w2 - w1);
            this.x = x1 + t * (x2 - x1);
            this.y = y1 + t * (y2 - y1);
            this.z = z1 + t * (z2 - z1);

            len = 1.0 / Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
            this.w *= len;
            this.x *= len;
            this.y *= len;
            this.z *= len;
        }

        /**
        * @language en_US
        * Fills the quaternion object with values representing the given euler rotation.
        *
        * @param    ax        The angle in radians of the rotation around the ax axis.
        * @param    ay        The angle in radians of the rotation around the ay axis.
        * @param    az        The angle in radians of the rotation around the az axis.
        */
        /**
        * @language zh_CN
        * 用数值表示给定的欧拉旋转填充四元数对象。
        *
        * @param ax x轴旋转角度
        * @param ay y轴旋转角度
        * @param az z轴旋转角度
        */
        public fromEulerAngles(ax: number, ay: number, az: number):Quaternion {
            ax *= Matrix3DUtils.DEGREES_TO_RADIANS;
            ay *= Matrix3DUtils.DEGREES_TO_RADIANS;
            az *= Matrix3DUtils.DEGREES_TO_RADIANS;

            var halfX: number = ax * 0.5, halfY: number = ay * 0.5, halfZ: number = az * 0.5;
            var cosX: number = Math.cos(halfX), sinX: number = Math.sin(halfX);
            var cosY: number = Math.cos(halfY), sinY: number = Math.sin(halfY);
            var cosZ: number = Math.cos(halfZ), sinZ: number = Math.sin(halfZ);

            this.w = cosX * cosY * cosZ + sinX * sinY * sinZ;
            this.x = sinX * cosY * cosZ - cosX * sinY * sinZ;
            this.y = cosX * sinY * cosZ + sinX * cosY * sinZ;
            this.z = cosX * cosY * sinZ - sinX * sinY * cosZ;

            return this;
        }

        /**
        * @language en_US
        * Fills a target Vector3D object with the Euler angles that form the rotation represented by this quaternion.
        * @param target An optional Vector3D object to contain the Euler angles. If not provided, a new object is created.
        * @returns The Vector3D containing the Euler angles.
        */
        /**
        * @language zh_CN
        * 把四元数转成欧拉角返回
        *
        * @param target 转成的欧拉返回值，如果为null就新建一个对象返回
        * @retruns 转成的欧拉返回值
        */
        public toEulerAngles(target: Vector3D = null): Vector3D {
            if (target === null) {
                target = new Vector3D();
            }

            target.x = Math.atan2(2.0 * (this.w * this.x + this.y * this.z), 1.0 - 2.0 * (this.x * this.x + this.y * this.y));

            var temp: number = 2.0 * (this.w * this.y - this.z * this.x);
            temp = Matrix3DUtils.clampf(temp, -1.0, 1.0);
            target.y = Math.asin(temp);
            target.z = Math.atan2(2.0 * (this.w * this.z + this.x * this.y), 1.0 - 2.0 * (this.y * this.y + this.z * this.z));

            target.x /= Matrix3DUtils.DEGREES_TO_RADIANS;
            target.y /= Matrix3DUtils.DEGREES_TO_RADIANS;
            target.z /= Matrix3DUtils.DEGREES_TO_RADIANS;
            return target;
        }

        /**
        * @language en_US
        * Normalises the quaternion object.
        */
        /**
        * @language zh_CN
        * 单位化四元数
        */
        public normalize(val: number = 1) {
            var mag: number = val / Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);

            this.x *= mag;
            this.y *= mag;
            this.z *= mag;
            this.w *= mag;
        }

        /**
        * @language en_US
        * Used to trace the values of a quaternion.
        *
        * @returns A string representation of the quaternion object.
        */
        /**
        * @language zh_CN
        * 以字符串形式返回四元数的值
        * @returns 
        */
        public toString(): string {
            return "{x:" + this.x + " y:" + this.y + " z:" + this.z + " w:" + this.w + "}";
        }

        /**
        * @language en_US
        * Converts the quaternion to a Matrix3D object representing an equivalent rotation.
        * @param target An optional Matrix3D container to store the transformation in. If not provided, a new object is created.
        * @returns A Matrix3D object representing an equivalent rotation.
        */
        /**
        * @language zh_CN
        * 把一个四元数转换成矩阵
        * @param target 返回转换后的矩阵，如果为null就新建一个对象返回
        * @see egret3d.Matrix3D
        * @returns 返回转换后的矩阵
        */
        public toMatrix3D(target: Matrix3D = null): Matrix3D {
            var rawData = Matrix3DUtils.RAW_DATA_CONTAINER;
            var xy2: number = 2.0 * this.x * this.y, xz2: number = 2.0 * this.x * this.z, xw2: number = 2.0 * this.x * this.w;
            var yz2: number = 2.0 * this.y * this.z, yw2: number = 2.0 * this.y * this.w, zw2: number = 2.0 * this.z * this.w;
            var xx: number = this.x * this.x, yy: number = this.y * this.y, zz: number = this.z * this.z, ww: number = this.w * this.w;

            rawData[0] = xx - yy - zz + ww;
            rawData[4] = xy2 - zw2;
            rawData[8] = xz2 + yw2;
            rawData[12] = 0;
            rawData[1] = xy2 + zw2;
            rawData[5] = -xx + yy - zz + ww;
            rawData[9] = yz2 - xw2;
            rawData[13] = 0;
            rawData[2] = xz2 - yw2;
            rawData[6] = yz2 + xw2;
            rawData[10] = -xx - yy + zz + ww;
            rawData[14] = 0;
            rawData[3] = 0.0;
            rawData[7] = 0.0;
            rawData[11] = 0;
            rawData[15] = 1;

            if (!target)
                return new Matrix3D(rawData);

            target.copyRawDataFrom(rawData);

            return target;
        }

        /**
        * @language en_US
        * Extracts a quaternion rotation matrix out of a given Matrix3D object.
        * @param matrix The Matrix3D out of which the rotation will be extracted.
        */
        /**
        * @language zh_CN
        * 用一个旋转矩阵生成四元数
        * @param matrix 旋转矩阵
        */
        public fromMatrix(matrix: Matrix3D) {
            var v: Vector3D = matrix.decompose(Orientation3D.QUATERNION)[1];
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            this.w = v.w;
        }

        /**
        * @language en_US
        * Clones the quaternion.
        * @returns An exact duplicate of the current Quaternion.
        */
        /**
        * @language zh_CN
        * 克隆一个四元数
        * @returns 当前四元数复制后返回.
        */
        public clone(): Quaternion {
            return new Quaternion(this.x, this.y, this.z, this.w);
        }

        /**
        * @language en_US
        * Rotates a point.
        * @param vector The Vector3D object to be rotated.
        * @param target An optional Vector3D object that will contain the rotated coordinates. If not provided, a new object will be created.
        * @returns A Vector3D object containing the rotated point.
        */
        /**
        * @language zh_CN
        * 旋转一个3量坐标点
        * @param vector 被旋转的对象
        * @param target 旋转后的坐标对象。如果为null，将创建一个新的对象
        * @returns 返回旋转后的坐标对象
        */
        public rotatePoint(vector: Vector3D, target: Vector3D = null): Vector3D {
            var x1: number, y1: number, z1: number, w1: number;
            var x2: number = vector.x, y2: number = vector.y, z2: number = vector.z;

            if (target === null) {
                target = new Vector3D();
            }

            // p*q'
            w1 = -this.x * x2 - this.y * y2 - this.z * z2;
            x1 =  this.w * x2 + this.y * z2 - this.z * y2;
            y1 =  this.w * y2 - this.x * z2 + this.z * x2;
            z1 =  this.w * z2 + this.x * y2 - this.y * x2;

            target.x = -w1 * this.x + x1 * this.w - y1 * this.z + z1 * this.y;
            target.y = -w1 * this.y + x1 * this.z + y1 * this.w - z1 * this.x;
            target.z = -w1 * this.z - x1 * this.y + y1 * this.x + z1 * this.w;
            return target;
        }

        /**
        * @language en_US
        * Copies the data from a quaternion into this instance.
        * @param q The quaternion to copy from.
        */
        /**
        * @language zh_CN
        * 将数据从四元数复制到该实例
        * @param q 被复制的四元数对象
        */
        public copyFrom(q: Quaternion) {
            this.x = q.x;
            this.y = q.y;
            this.z = q.z;
            this.w = q.w;
        }
    }

} 