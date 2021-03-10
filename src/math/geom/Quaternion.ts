namespace feng3d
{
	/**
	 * 可用于表示旋转的四元数对象
	 */
    export class Quaternion
    {
        static fromArray(array: ArrayLike<number>, offset = 0)
        {
            return new Quaternion().fromArray(array, offset);
        }

        /**
         * 随机四元数
         */
        static random()
        {
            return new Quaternion().fromEulerAngles(Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());
        }

		/**
		 * 虚基向量i的乘子
		 */
        @serialize
        x = 0;

		/**
		 * 虚基向量j的乘子
		 */
        @serialize
        y = 0;

		/**
		 * 虚基向量k的乘子
		 */
        @serialize
        z = 0;

		/**
		 * 实部的乘数
		 */
        @serialize
        w = 1;

		/**
		 * 四元数描述三维空间中的旋转。四元数的数学定义为Q = x*i + y*j + z*k + w，其中(i,j,k)为虚基向量。(x,y,z)可以看作是一个与旋转轴相关的向量，而实际的乘法器w与旋转量相关。
         * 
		 * @param x 虚基向量i的乘子
		 * @param y 虚基向量j的乘子
		 * @param z 虚基向量k的乘子
		 * @param w 实部的乘数
		 */
        constructor(x = 0, y = 0, z = 0, w = 1)
        {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }

		/**
		 * 返回四元数对象的大小
		 */
        get magnitude(): number
        {
            return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
        }

        /**
         * 设置四元数的值。
         * 
		 * @param x 虚基向量i的乘子
		 * @param y 虚基向量j的乘子
		 * @param z 虚基向量k的乘子
		 * @param w 实部的乘数
         */
        set(x = 0, y = 0, z = 0, w = 1)
        {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        }

        fromArray(array: ArrayLike<number>, offset = 0)
        {
            this.x = array[offset];
            this.y = array[offset + 1];
            this.z = array[offset + 2];
            this.w = array[offset + 3];
            return this;
        }

        /**
         * 转换为数组
         * 
         * @param array 
         * @param offset 
         */
        toArray(array?: number[], offset = 0)
        {
            array = array || [];
            array[offset] = this.x;
            array[offset + 1] = this.y;
            array[offset + 2] = this.z;
            array[offset + 3] = this.w;
            return array;
        }

		/**
         * 四元数乘法
		 *
         * @param q
         * @param this
         */
        mult(q: Quaternion)
        {
            var ax = this.x, ay = this.y, az = this.z, aw = this.w,
                bx = q.x, by = q.y, bz = q.z, bw = q.w;

            this.x = ax * bw + aw * bx + ay * bz - az * by;
            this.y = ay * bw + aw * by + az * bx - ax * bz;
            this.z = az * bw + aw * bz + ax * by - ay * bx;
            this.w = aw * bw - ax * bx - ay * by - az * bz;
            return this;
        }

		/**
         * 四元数乘法
		 *
         * @param q
         * @param target
         */
        multTo(q: Quaternion, target = new Quaternion())
        {
            return target.copy(this).mult(q);
        }

        /**
         * 获取逆四元数（共轭四元数）
         */
        inverse()
        {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;

            return this;
        }

        /**
         * 获取逆四元数（共轭四元数）
         * 
         * @param target
         */
        inverseTo(target = new Quaternion())
        {
            return target.copy(this).inverse();
        }

        multiplyVector(vector: Vector3, target = new Quaternion())
        {
            var x2 = vector.x;
            var y2 = vector.y;
            var z2 = vector.z;

            target.w = -this.x * x2 - this.y * y2 - this.z * z2;
            target.x = this.w * x2 + this.y * z2 - this.z * y2;
            target.y = this.w * y2 - this.x * z2 + this.z * x2;
            target.z = this.w * z2 + this.x * y2 - this.y * x2;

            return target;
        }

		/**
		 * 用表示给定绕向量旋转的值填充四元数对象。
		 *
		 * @param axis 要绕其旋转的轴
		 * @param angle 以弧度为单位的旋转角度。
		 */
        fromAxisAngle(axis: Vector3, angle: number)
        {
            var sin_a = Math.sin(angle / 2);
            var cos_a = Math.cos(angle / 2);

            this.x = axis.x * sin_a;
            this.y = axis.y * sin_a;
            this.z = axis.z * sin_a;
            this.w = cos_a;
            this.normalize();
            return this;
        }

        /**
         * 将四元数转换为轴/角表示形式
         * 
         * @param targetAxis 要重用的向量对象，用于存储轴
         * @return 一个数组，第一个元素是轴，第二个元素是弧度
         */
        toAxisAngle(targetAxis = new Vector3())
        {
            this.normalize(); // 如果w>1 acos和sqrt会产生错误，那么如果四元数被标准化，就不会发生这种情况
            var angle = 2 * Math.acos(this.w);
            var s = Math.sqrt(1 - this.w * this.w); // 假设四元数归一化了，那么w小于1，所以项总是正的。
            if (s < 0.001)
            { // 为了避免除以零，s总是正的，因为是根号
                // 如果s接近于零，那么轴的方向就不重要了
                targetAxis.x = this.x; // 如果轴归一化很重要，则用x=1替换;y = z = 0;
                targetAxis.y = this.y;
                targetAxis.z = this.z;
            } else
            {
                targetAxis.x = this.x / s; // 法线轴
                targetAxis.y = this.y / s;
                targetAxis.z = this.z / s;
            }
            return [targetAxis, angle];
        }

        /**
         * 给定两个向量，设置四元数值。得到的旋转将是将u旋转到v所需要的旋转。
         * 
         * @param u
         * @param v
         */
        setFromVectors(u: Vector3, v: Vector3)
        {
            if (u.isAntiparallelTo(v))
            {
                var t1 = new Vector3();
                var t2 = new Vector3();

                u.tangents(t1, t2);
                this.fromAxisAngle(t1, Math.PI);
            } else
            {
                var a = u.crossTo(v);
                this.x = a.x;
                this.y = a.y;
                this.z = a.z;
                this.w = Math.sqrt(Math.pow(u.length, 2) * Math.pow(v.length, 2)) + u.dot(v);
                this.normalize();
            }
            return this;
        }

		/**
		 * 与目标四元数之间进行球面内插，提供了具有恒定角度变化率的旋转之间的内插。
		 * @param qb 目标四元素
		 * @param t 插值权值，一个介于0和1之间的值。
		 */
        slerp(qb: Quaternion, t: number)
        {
            if (t === 0) return this;
            if (t === 1) return this.copy(qb);

            var x = this.x, y = this.y, z = this.z, w = this.w;

            // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

            var cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

            if (cosHalfTheta < 0)
            {
                this.w = - qb.w;
                this.x = - qb.x;
                this.y = - qb.y;
                this.z = - qb.z;

                cosHalfTheta = - cosHalfTheta;

            } else
            {
                this.copy(qb);
            }

            if (cosHalfTheta >= 1.0)
            {
                this.w = w;
                this.x = x;
                this.y = y;
                this.z = z;
                return this;
            }

            var sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

            if (sqrSinHalfTheta <= Number.EPSILON)
            {
                var s = 1 - t;
                this.w = s * w + t * this.w;
                this.x = s * x + t * this.x;
                this.y = s * y + t * this.y;
                this.z = s * z + t * this.z;

                this.normalize();

                return this;
            }

            var sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
            var halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
            var ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta,
                ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

            this.w = (w * ratioA + this.w * ratioB);
            this.x = (x * ratioA + this.x * ratioB);
            this.y = (y * ratioA + this.y * ratioB);
            this.z = (z * ratioA + this.z * ratioB);

            return this;
        }

		/**
		 * 与目标四元数之间进行球面内插，提供了具有恒定角度变化率的旋转之间的内插。
		 * @param qb 目标四元素
		 * @param t 插值权值，一个介于0和1之间的值。
         * @param out 保存插值结果 
		 */
        slerpTo(qb: Quaternion, t: number, out = new Quaternion())
        {
            if (qb == out) qb = qb.clone();
            return out.copy(this).slerp(qb, t);
        }

		/**
		 * 线性求插值
		 * @param qa 第一个四元素
		 * @param qb 第二个四元素
		 * @param t 权重
		 */
        lerp(qa: Quaternion, qb: Quaternion, t: number)
        {
            var w1 = qa.w, x1 = qa.x, y1 = qa.y, z1 = qa.z;
            var w2 = qb.w, x2 = qb.x, y2 = qb.y, z2 = qb.z;
            var len: number;

            // shortest direction
            if (w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2 < 0)
            {
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
		 * Fills the quaternion object with values representing the given euler rotation.
		 *
		 * @param    ax        The angle in radians of the rotation around the ax axis.
		 * @param    ay        The angle in radians of the rotation around the ay axis.
		 * @param    az        The angle in radians of the rotation around the az axis.
		 */
        fromEulerAngles(ax: number, ay: number, az: number)
        {
            var halfX = ax * .5, halfY = ay * .5, halfZ = az * .5;
            var cosX = Math.cos(halfX), sinX = Math.sin(halfX);
            var cosY = Math.cos(halfY), sinY = Math.sin(halfY);
            var cosZ = Math.cos(halfZ), sinZ = Math.sin(halfZ);

            this.w = cosX * cosY * cosZ + sinX * sinY * sinZ;
            this.x = sinX * cosY * cosZ - cosX * sinY * sinZ;
            this.y = cosX * sinY * cosZ + sinX * cosY * sinZ;
            this.z = cosX * cosY * sinZ - sinX * sinY * cosZ;
            return this;
        }

		/**
		 * Fills a target Vector3 object with the Euler angles that form the rotation represented by this quaternion.
		 * @param target An optional Vector3 object to contain the Euler angles. If not provided, a new object is created.
		 * @return The Vector3 containing the Euler angles.
		 */
        toEulerAngles(target?: Vector3): Vector3
        {
            target = target || new Vector3();
            target.x = Math.atan2(2 * (this.w * this.x + this.y * this.z), 1 - 2 * (this.x * this.x + this.y * this.y));
            var asinvalue = 2 * (this.w * this.y - this.z * this.x);
            //防止超出范围，获取NaN值
            asinvalue = Math.max(-1, Math.min(asinvalue, 1));
            target.y = Math.asin(asinvalue);
            target.z = Math.atan2(2 * (this.w * this.z + this.x * this.y), 1 - 2 * (this.y * this.y + this.z * this.z));
            return target;
        }

		/**
		 * 四元数归一化
		 */
        normalize(val = 1)
        {
            var l = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
            if (l === 0)
            {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 1;
            } else
            {
                l = Math.sqrt(l);
                l = 1 / l;
                this.x *= l;
                this.y *= l;
                this.z *= l;
                this.w *= l;
            }
            return this;
        }


        /**
         * 四元数归一化的近似。当quat已经几乎标准化时，效果最好。
         * 
         * @see http://jsperf.com/fast-quaternion-normalization
         * @author unphased, https://github.com/unphased
         */
        normalizeFast()
        {
            var f = (3.0 - (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)) / 2.0;
            if (f === 0)
            {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 0;
            } else
            {
                this.x *= f;
                this.y *= f;
                this.z *= f;
                this.w *= f;
            }
            return this;
        }

		/**
		 * 转换为可读格式
		 */
        toString()
        {
            return "{this.x:" + this.x + " this.y:" + this.y + " this.z:" + this.z + " this.w:" + this.w + "}";
        }

        /**
         * 转换为矩阵
         * 
         * @param target 
         */
        toMatrix(target = new Matrix4x4())
        {
            var elements = target.elements;
            var xy2 = 2.0 * this.x * this.y, xz2 = 2.0 * this.x * this.z, xw2 = 2.0 * this.x * this.w;
            var yz2 = 2.0 * this.y * this.z, yw2 = 2.0 * this.y * this.w, zw2 = 2.0 * this.z * this.w;
            var xx = this.x * this.x, yy = this.y * this.y, zz = this.z * this.z, ww = this.w * this.w;

            elements[0] = xx - yy - zz + ww;
            elements[4] = xy2 - zw2;
            elements[8] = xz2 + yw2;
            elements[12] = 0;
            elements[1] = xy2 + zw2;
            elements[5] = -xx + yy - zz + ww;
            elements[9] = yz2 - xw2;
            elements[13] = 0;
            elements[2] = xz2 - yw2;
            elements[6] = yz2 + xw2;
            elements[10] = -xx - yy + zz + ww;
            elements[14] = 0;
            elements[3] = 0.0;
            elements[7] = 0.0;
            elements[11] = 0;
            elements[15] = 1;
            return target;
        }

        /**
         * 从矩阵初始化四元素
         * 
         * @param matrix 矩阵
         */
        fromMatrix(matrix: Matrix4x4)
        {
            var v: Vector3 = matrix.toTRS()[1];
            v.scaleNumber(Math.RAD2DEG);
            this.fromEulerAngles(v.x, v.y, v.z);
            return this;
        }

		/**
         * 克隆
		 */
        clone()
        {
            return new Quaternion(this.x, this.y, this.z, this.w);
        }

        /**
         * 旋转一个顶点
         * 
         * @param point 被旋转的顶点
         * @param target 旋转结果
         */
        rotatePoint(point: Vector3, target = new Vector3())
        {
            var x2 = point.x, y2 = point.y, z2 = point.z;

            // p*q'
            var w1 = -this.x * x2 - this.y * y2 - this.z * z2;
            var x1 = this.w * x2 + this.y * z2 - this.z * y2;
            var y1 = this.w * y2 - this.x * z2 + this.z * x2;
            var z1 = this.w * z2 + this.x * y2 - this.y * x2;

            target.x = -w1 * this.x + x1 * this.w - y1 * this.z + z1 * this.y;
            target.y = -w1 * this.y + x1 * this.z + y1 * this.w - z1 * this.x;
            target.z = -w1 * this.z - x1 * this.y + y1 * this.x + z1 * this.w;

            return target;
        }

        /**
         * 旋转一个绝对方向四元数给定一个角速度和一个时间步长
         * 
         * @param angularVelocity
         * @param dt
         * @param angularFactor
         */
        integrate(angularVelocity: Vector3, dt: number, angularFactor: Vector3)
        {
            var ax = angularVelocity.x * angularFactor.x,
                ay = angularVelocity.y * angularFactor.y,
                az = angularVelocity.z * angularFactor.z,
                bx = this.x,
                by = this.y,
                bz = this.z,
                bw = this.w;

            var half_dt = dt * 0.5;

            this.x += half_dt * (ax * bw + ay * bz - az * by);
            this.y += half_dt * (ay * bw + az * bx - ax * bz);
            this.z += half_dt * (az * bw + ax * by - ay * bx);
            this.w += half_dt * (- ax * bx - ay * by - az * bz);

            return this;
        }

        /**
         * 旋转一个绝对方向四元数给定一个角速度和一个时间步长
         * 
         * @param angularVelocity
         * @param dt
         * @param angularFactor
         * @param  target
         */
        integrateTo(angularVelocity: Vector3, dt: number, angularFactor: Vector3, target = new Quaternion())
        {
            return target.copy(this).integrate(angularVelocity, dt, angularFactor);
        }

		/**
		 * 将源的值复制到此四元数
         * 
		 * @param q 要复制的四元数
		 */
        copy(q: Quaternion)
        {
            this.x = q.x;
            this.y = q.y;
            this.z = q.z;
            this.w = q.w;
            return this;
        }

        /**
         * Multiply the quaternion by a vector
         * @param v
         * @param target Optional
         */
        vmult(v: Vector3, target = new Vector3())
        {
            var x = v.x,
                y = v.y,
                z = v.z;

            var qx = this.x,
                qy = this.y,
                qz = this.z,
                qw = this.w;

            // q*v
            var ix = qw * x + qy * z - qz * y,
                iy = qw * y + qz * x - qx * z,
                iz = qw * z + qx * y - qy * x,
                iw = -qx * x - qy * y - qz * z;

            target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

            return target;
        }

        /**
         * Convert the quaternion to euler angle representation. Order: YZX, as this page describes: http://www.euclideanspace.com/maths/standards/index.htm
         * @param target
         * @param order Three-character string e.g. "YZX", which also is default.
         */
        toEuler(target: Vector3, order = "YZX")
        {
            var heading, attitude, bank;
            var x = this.x, y = this.y, z = this.z, w = this.w;

            switch (order)
            {
                case "YZX":
                    var test = x * y + z * w;
                    if (test > 0.499)
                    { // singularity at north pole
                        heading = 2 * Math.atan2(x, w);
                        attitude = Math.PI / 2;
                        bank = 0;
                    }
                    if (test < -0.499)
                    { // singularity at south pole
                        heading = -2 * Math.atan2(x, w);
                        attitude = - Math.PI / 2;
                        bank = 0;
                    }
                    if (isNaN(heading))
                    {
                        var sqx = x * x;
                        var sqy = y * y;
                        var sqz = z * z;
                        heading = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * sqy - 2 * sqz); // Heading
                        attitude = Math.asin(2 * test); // attitude
                        bank = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * sqx - 2 * sqz); // bank
                    }
                    break;
                default:
                    throw new Error("Euler order " + order + " not supported yet.");
            }

            target.y = heading;
            target.z = attitude;
            target.x = bank;
        }


        /**
         * See http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m
         * @param x
         * @param y
         * @param z
         * @param order The order to apply angles: 'XYZ' or 'YXZ' or any other combination
         */
        setFromEuler(x: number, y: number, z: number, order = "XYZ")
        {
            var c1 = Math.cos(x / 2);
            var c2 = Math.cos(y / 2);
            var c3 = Math.cos(z / 2);
            var s1 = Math.sin(x / 2);
            var s2 = Math.sin(y / 2);
            var s3 = Math.sin(z / 2);

            if (order === 'XYZ')
            {

                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;

            } else if (order === 'YXZ')
            {

                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;

            } else if (order === 'ZXY')
            {

                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;

            } else if (order === 'ZYX')
            {

                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;

            } else if (order === 'YZX')
            {

                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;

            } else if (order === 'XZY')
            {

                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;

            }

            return this;
        }


    }
}