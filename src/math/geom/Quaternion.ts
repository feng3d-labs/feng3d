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
            return new Quaternion().fromEuler(Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());
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
            return Math.sqrt((this.w * this.w) + (this.x * this.x) + (this.y * this.y) + (this.z * this.z));
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
            const ax = this.x;
            const ay = this.y;
            const az = this.z;
            const aw = this.w;
            const bx = q.x;
            const by = q.y;
            const bz = q.z;
            const bw = q.w;

            this.x = (ax * bw) + (aw * bx) + (ay * bz) - (az * by);
            this.y = (ay * bw) + (aw * by) + (az * bx) - (ax * bz);
            this.z = (az * bw) + (aw * bz) + (ax * by) - (ay * bx);
            this.w = (aw * bw) - (ax * bx) - (ay * by) - (az * bz);

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
            const x2 = vector.x;
            const y2 = vector.y;
            const z2 = vector.z;

            target.w = -(this.x * x2) - (this.y * y2) - (this.z * z2);
            target.x = (this.w * x2) + (this.y * z2) - (this.z * y2);
            target.y = (this.w * y2) - (this.x * z2) + (this.z * x2);
            target.z = (this.w * z2) + (this.x * y2) - (this.y * x2);

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
            const sinA = Math.sin(angle / 2);
            const cosA = Math.cos(angle / 2);

            this.x = axis.x * sinA;
            this.y = axis.y * sinA;
            this.z = axis.z * sinA;
            this.w = cosA;
            this.normalize();

            return this;
        }

        /**
         * 将四元数转换为轴/角表示形式
         *
         * @param targetAxis 要重用的向量对象，用于存储轴
         * @returns 一个数组，第一个元素是轴，第二个元素是弧度
         */
        toAxisAngle(targetAxis = new Vector3())
        {
            this.normalize(); // 如果w>1 acos和sqrt会产生错误，那么如果四元数被标准化，就不会发生这种情况
            const angle = 2 * Math.acos(this.w);
            const s = Math.sqrt(1 - (this.w * this.w)); // 假设四元数归一化了，那么w小于1，所以项总是正的。

            if (s < 0.001)
            { // 为了避免除以零，s总是正的，因为是根号
                // 如果s接近于零，那么轴的方向就不重要了
                targetAxis.x = this.x; // 如果轴归一化很重要，则用x=1替换;y = z = 0;
                targetAxis.y = this.y;
                targetAxis.z = this.z;
            }
            else
            {
                targetAxis.x = this.x / s; // 法线轴
                targetAxis.y = this.y / s;
                targetAxis.z = this.z / s;
            }

            return [targetAxis, angle];
        }

        /**
         * 给定两个单位向量，设置四元数值。得到的旋转将是将u旋转到v所需要的旋转。
         *
         * @param u 表示起始方向的单位向量。
         * @param v 表示终止方向的单位向量。
         */
        fromUnitVectors(u: Vector3, v: Vector3)
        {
            let r = u.dot(v) + 1;

            if (r < mathUtil.PRECISION)
            {
                r = 0;

                if (Math.abs(u.x) > Math.abs(u.z))
                {
                    this.x = -u.y;
                    this.y = u.x;
                    this.z = 0;
                    this.w = r;
                }
                else
                {
                    this.x = 0;
                    this.y = -u.z;
                    this.z = u.y;
                    this.w = r;
                }
            }
            else
            {
                const a = u.crossTo(v);

                this.x = a.x;
                this.y = a.y;
                this.z = a.z;
                this.w = r;
            }
            this.normalize();

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

            const x = this.x;
            const y = this.y;
            const z = this.z;
            const w = this.w;

            // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

            let cosHalfTheta = (w * qb.w) + (x * qb.x) + (y * qb.y) + (z * qb.z);

            if (cosHalfTheta < 0)
            {
                this.w = -qb.w;
                this.x = -qb.x;
                this.y = -qb.y;
                this.z = -qb.z;

                cosHalfTheta = -cosHalfTheta;
            }
            else
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

            const sqrSinHalfTheta = 1.0 - (cosHalfTheta * cosHalfTheta);

            if (sqrSinHalfTheta <= Number.EPSILON)
            {
                const s = 1 - t;

                this.w = (s * w) + (t * this.w);
                this.x = (s * x) + (t * this.x);
                this.y = (s * y) + (t * this.y);
                this.z = (s * z) + (t * this.z);

                this.normalize();

                return this;
            }

            const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
            const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
            const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
            const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

            this.w = ((w * ratioA) + (this.w * ratioB));
            this.x = ((x * ratioA) + (this.x * ratioB));
            this.y = ((y * ratioA) + (this.y * ratioB));
            this.z = ((z * ratioA) + (this.z * ratioB));

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
            if (qb === out) qb = qb.clone();

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
            const w1 = qa.w;
            const x1 = qa.x;
            const y1 = qa.y;
            const z1 = qa.z;
            let w2 = qb.w;
            let x2 = qb.x;
            let y2 = qb.y;
            let z2 = qb.z;

            // shortest direction
            if ((w1 * w2) + (x1 * x2) + (y1 * y2) + (z1 * z2) < 0)
            {
                w2 = -w2;
                x2 = -x2;
                y2 = -y2;
                z2 = -z2;
            }

            this.w = w1 + (t * (w2 - w1));
            this.x = x1 + (t * (x2 - x1));
            this.y = y1 + (t * (y2 - y1));
            this.z = z1 + (t * (z2 - z1));

            const len = 1.0 / Math.sqrt((this.w * this.w) + (this.x * this.x) + (this.y * this.y) + (this.z * this.z));

            this.w *= len;
            this.x *= len;
            this.y *= len;
            this.z *= len;
        }

        /**
         * Fills a target Vector3 object with the Euler angles that form the rotation represented by this quaternion.
         * @param target An optional Vector3 object to contain the Euler angles. If not provided, a new object is created.
         * @returns The Vector3 containing the Euler angles.
         */
        toEulerAngles(target?: Vector3): Vector3
        {
            target = target || new Vector3();
            target.x = Math.atan2(2 * ((this.w * this.x) + (this.y * this.z)), 1 - (2 * ((this.x * this.x) + (this.y * this.y))));
            let asinvalue = 2 * ((this.w * this.y) - (this.z * this.x));
            // 防止超出范围，获取NaN值

            asinvalue = Math.max(-1, Math.min(asinvalue, 1));
            target.y = Math.asin(asinvalue);
            target.z = Math.atan2(2 * ((this.w * this.z) + (this.x * this.y)), 1 - (2 * ((this.y * this.y) + (this.z * this.z))));

            return target;
        }

        /**
         * 四元数归一化
         */
        normalize(val = 1)
        {
            let l = (this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w);

            if (l === 0)
            {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 1;
            }
            else
            {
                l = Math.sqrt(l);
                l = val / l;
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
            const f = (3.0 - ((this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w))) / 2.0;

            if (f === 0)
            {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 0;
            }
            else
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
            return `{this.x:${this.x} this.y:${this.y} this.z:${this.z} this.w:${this.w}}`;
        }

        /**
         * 转换为矩阵
         *
         * @param target
         */
        toMatrix(target = new Matrix4x4())
        {
            const elements = target.elements;
            const { x, y, z, w } = this;
            //
            const xy2 = 2 * x * y;
            const xz2 = 2 * x * z;
            const xw2 = 2 * x * w;
            const yz2 = 2 * y * z;
            const yw2 = 2 * y * w;
            const zw2 = 2 * z * w;
            const xx = x * x;
            const yy = y * y;
            const zz = z * z;
            const ww = w * w;

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
            elements[3] = 0;
            elements[7] = 0;
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
            const v: Vector3 = matrix.toTRS()[1];

            this.fromEuler(v.x, v.y, v.z);

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
            const x2 = point.x;
            const y2 = point.y;
            const z2 = point.z;

            // p*q'
            const w1 = -(this.x * x2) - (this.y * y2) - (this.z * z2);
            const x1 = (this.w * x2) + (this.y * z2) - (this.z * y2);
            const y1 = (this.w * y2) - (this.x * z2) + (this.z * x2);
            const z1 = (this.w * z2) + (this.x * y2) - (this.y * x2);

            target.x = -(w1 * this.x) + (x1 * this.w) - (y1 * this.z) + (z1 * this.y);
            target.y = -(w1 * this.y) + (x1 * this.z) + (y1 * this.w) - (z1 * this.x);
            target.z = -(w1 * this.z) - (x1 * this.y) + (y1 * this.x) + (z1 * this.w);

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
            const ax = angularVelocity.x * angularFactor.x;
            const ay = angularVelocity.y * angularFactor.y;
            const az = angularVelocity.z * angularFactor.z;
            const bx = this.x;
            const by = this.y;
            const bz = this.z;
            const bw = this.w;

            const halfDt = dt * 0.5;

            this.x += halfDt * ((ax * bw) + (ay * bz) - (az * by));
            this.y += halfDt * ((ay * bw) + (az * bx) - (ax * bz));
            this.z += halfDt * ((az * bw) + (ax * by) - (ay * bx));
            this.w += halfDt * (-(ax * bx) - (ay * by) - (az * bz));

            return this;
        }

        /**
         * 旋转一个绝对方向四元数给定一个角速度和一个时间步长
         *
         * @param angularVelocity
         * @param dt
         * @param angularFactor
         * @param target
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
            const x = v.x;
            const y = v.y;
            const z = v.z;

            const qx = this.x;
            const qy = this.y;
            const qz = this.z;
            const qw = this.w;

            // q*v
            const ix = (qw * x) + (qy * z) - (qz * y);
            const iy = (qw * y) + (qz * x) - (qx * z);
            const iz = (qw * z) + (qx * y) - (qy * x);
            const iw = -(qx * x) - (qy * y) - (qz * z);

            target.x = (ix * qw) + (iw * -qx) + (iy * -qz) - (iz * -qy);
            target.y = (iy * qw) + (iw * -qy) + (iz * -qx) - (ix * -qz);
            target.z = (iz * qw) + (iw * -qz) + (ix * -qy) - (iy * -qx);

            return target;
        }

        /**
         * Convert the quaternion to euler angle representation. Order: YZX, as this page describes: http://www.euclideanspace.com/maths/standards/index.htm
         * @param target
         * @param order Three-character string e.g. "YZX", which also is default.
         */
        toEuler(target: Vector3, order = 'YZX')
        {
            let heading: number;
            let attitude: number;
            let bank: number;
            let test: number;
            const x = this.x;
            const y = this.y;
            const z = this.z;
            const w = this.w;

            switch (order)
            {
                case 'YZX':
                    test = (x * y) + (z * w);

                    if (test > 0.499)
                    { // singularity at north pole
                        heading = 2 * Math.atan2(x, w);
                        attitude = Math.PI / 2;
                        bank = 0;
                    }
                    if (test < -0.499)
                    { // singularity at south pole
                        heading = -2 * Math.atan2(x, w);
                        attitude = -Math.PI / 2;
                        bank = 0;
                    }
                    if (isNaN(heading))
                    {
                        const sqx = x * x;
                        const sqy = y * y;
                        const sqz = z * z;

                        heading = Math.atan2((2 * y * w) - (2 * x * z), 1 - (2 * sqy) - (2 * sqz)); // Heading
                        attitude = Math.asin(2 * test); // attitude
                        bank = Math.atan2((2 * x * w) - (2 * y * z), 1 - (2 * sqx) - (2 * sqz)); // bank
                    }
                    break;
                default:
                    throw new Error(`Euler order ${order} not supported yet.`);
            }

            target.y = heading;
            target.z = attitude;
            target.x = bank;
        }

        /**
         * 从欧拉角初始化四元素。
         *
         * @param x 围绕X轴旋转角度。
         * @param y 围绕Y轴旋转角度。
         * @param z 围绕Z轴旋转角度。
         * @param order X、Y、Z轴旋顺序。
         *
         * @see http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m
         */
        fromEuler(x: number, y: number, z: number, order: RotationOrder = mathUtil.DefaultRotationOrder)
        {
            // 角度转换为弧度
            x = x * mathUtil.DEG2RAD;
            y = y * mathUtil.DEG2RAD;
            z = z * mathUtil.DEG2RAD;

            const cosX = Math.cos(x / 2);
            const coxY = Math.cos(y / 2);
            const cosZ = Math.cos(z / 2);
            const sinX = Math.sin(x / 2);
            const sinY = Math.sin(y / 2);
            const sinZ = Math.sin(z / 2);

            if (order === RotationOrder.XYZ)
            {
                this.x = (sinX * coxY * cosZ) + (cosX * sinY * sinZ);
                this.y = (cosX * sinY * cosZ) - (sinX * coxY * sinZ);
                this.z = (cosX * coxY * sinZ) + (sinX * sinY * cosZ);
                this.w = (cosX * coxY * cosZ) - (sinX * sinY * sinZ);
            }
            else if (order === RotationOrder.YXZ)
            {
                this.x = (sinX * coxY * cosZ) + (cosX * sinY * sinZ);
                this.y = (cosX * sinY * cosZ) - (sinX * coxY * sinZ);
                this.z = (cosX * coxY * sinZ) - (sinX * sinY * cosZ);
                this.w = (cosX * coxY * cosZ) + (sinX * sinY * sinZ);
            }
            else if (order === RotationOrder.ZXY)
            {
                this.x = (sinX * coxY * cosZ) - (cosX * sinY * sinZ);
                this.y = (cosX * sinY * cosZ) + (sinX * coxY * sinZ);
                this.z = (cosX * coxY * sinZ) + (sinX * sinY * cosZ);
                this.w = (cosX * coxY * cosZ) - (sinX * sinY * sinZ);
            }
            else if (order === RotationOrder.ZYX)
            {
                this.x = (sinX * coxY * cosZ) - (cosX * sinY * sinZ);
                this.y = (cosX * sinY * cosZ) + (sinX * coxY * sinZ);
                this.z = (cosX * coxY * sinZ) - (sinX * sinY * cosZ);
                this.w = (cosX * coxY * cosZ) + (sinX * sinY * sinZ);
            }
            else if (order === RotationOrder.YZX)
            {
                this.x = (sinX * coxY * cosZ) + (cosX * sinY * sinZ);
                this.y = (cosX * sinY * cosZ) + (sinX * coxY * sinZ);
                this.z = (cosX * coxY * sinZ) - (sinX * sinY * cosZ);
                this.w = (cosX * coxY * cosZ) - (sinX * sinY * sinZ);
            }
            else if (order === RotationOrder.XZY)
            {
                this.x = (sinX * coxY * cosZ) - (cosX * sinY * sinZ);
                this.y = (cosX * sinY * cosZ) - (sinX * coxY * sinZ);
                this.z = (cosX * coxY * sinZ) + (sinX * sinY * cosZ);
                this.w = (cosX * coxY * cosZ) + (sinX * sinY * sinZ);
            }

            return this;
        }

        /**
         * 与指定四元素比较是否相等。
         *
         * @param v 比较的向量。
         * @param precision 允许误差。
         * @returns 相等返回true，否则false。
         */
        equals(v: Quaternion, precision = mathUtil.PRECISION)
        {
            // 四元素与四元素的负值等价。 {1,2,3,4} === {-1,-2,-3,-4}
            if (this.x * v.x > 0)
            {
                if (!mathUtil.equals(this.x - v.x, 0, precision))
                {
                    return false;
                }
                if (!mathUtil.equals(this.y - v.y, 0, precision))
                {
                    return false;
                }
                if (!mathUtil.equals(this.z - v.z, 0, precision))
                {
                    return false;
                }
                if (!mathUtil.equals(this.w - v.w, 0, precision))
                {
                    return false;
                }
            }
            else
            {
                if (!mathUtil.equals(this.x + v.x, 0, precision))
                {
                    return false;
                }
                if (!mathUtil.equals(this.y + v.y, 0, precision))
                {
                    return false;
                }
                if (!mathUtil.equals(this.z + v.z, 0, precision))
                {
                    return false;
                }
                if (!mathUtil.equals(this.w + v.w, 0, precision))
                {
                    return false;
                }
            }

            return true;
        }
    }
}