namespace feng3d
{
    type NmberArray9 = [
        number, number, number,
        number, number, number,
        number, number, number,
    ];

    /**
     * Matrix3x3 类表示一个转换矩阵，该矩阵确定二维 (2D) 显示对象的位置和方向。
     * 该矩阵可以执行转换功能，包括平移（沿 x 和 y 轴重新定位）、旋转和缩放（调整大小）。
     * ```
     *  ---                                   ---
     *  |   scaleX      0         0    |   x轴
     *  |     0       scaleY      0    |   y轴
     *  |     tx        ty        1    |   平移
     *  ---                                   ---
     * 
     *  ---                                   ---
     *  |     0         1         2    |   x轴
     *  |     3         4         5    |   y轴
     *  |     6         7         8    |   平移
     *  ---                                   ---
     * ```
     */
    export class Matrix3x3
    {
        /**
         * 长度为9的向量，包含所有的矩阵元素
         */
        elements: NmberArray9;

        /**
         * 构建3x3矩阵
         * 
         * @param elements 九个元素的数组
         */
        constructor(elements: NmberArray9 = [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1])
        {
            this.elements = elements;
        }

        /**
         * 设置矩阵为单位矩阵
         */
        identity()
        {
            var e = this.elements;
            e[0] = 1;
            e[1] = 0;
            e[2] = 0;

            e[3] = 0;
            e[4] = 1;
            e[5] = 0;

            e[6] = 0;
            e[7] = 0;
            e[8] = 1;
            return this;
        }

        /**
         * 将所有元素设置为0
         */
        setZero()
        {
            var e = this.elements;
            e[0] = 0;
            e[1] = 0;
            e[2] = 0;
            e[3] = 0;
            e[4] = 0;
            e[5] = 0;
            e[6] = 0;
            e[7] = 0;
            e[8] = 0;
            return this;
        }

        /**
         * 根据一个 Vector3 设置矩阵对角元素
         * 
         * @param vec3
         */
        setTrace(vec3: Vector3)
        {
            var e = this.elements;
            e[0] = vec3.x;
            e[4] = vec3.y;
            e[8] = vec3.z;
            return this;
        }

        /**
         * 获取矩阵对角元素
         */
        getTrace(target = new Vector3())
        {
            var e = this.elements;
            target.x = e[0];
            target.y = e[4];
            target.z = e[8];
            return target;
        }

        /**
         * 矩阵向量乘法
         * 
         * @param v 要乘以的向量
         * @param target 目标保存结果
         */
        vmult(v: Vector3, target = new Vector3())
        {
            var e = this.elements,
                x = v.x,
                y = v.y,
                z = v.z;
            target.x = e[0] * x + e[1] * y + e[2] * z;
            target.y = e[3] * x + e[4] * y + e[5] * z;
            target.z = e[6] * x + e[7] * y + e[8] * z;

            return target;
        }

        /**
         * 矩阵标量乘法
         * @param s
         */
        smult(s: number)
        {
            for (var i = 0; i < this.elements.length; i++)
            {
                this.elements[i] *= s;
            }
        }

        /**
         * 矩阵乘法
         * @param  m 要从左边乘的矩阵。
         */
        mmult(m: Matrix3x3, target = new Matrix3x3())
        {
            for (var i = 0; i < 3; i++)
            {
                for (var j = 0; j < 3; j++)
                {
                    var sum = 0.0;
                    for (var k = 0; k < 3; k++)
                    {
                        sum += m.elements[i + k * 3] * this.elements[k + j * 3];
                    }
                    target.elements[i + j * 3] = sum;
                }
            }
            return target;
        }

        /**
         * 缩放矩阵的每一列
         * 
         * @param v
         */
        scale(v: Vector3, target = new Matrix3x3())
        {
            var e = this.elements,
                t = target.elements;
            for (var i = 0; i !== 3; i++)
            {
                t[3 * i + 0] = v.x * e[3 * i + 0];
                t[3 * i + 1] = v.y * e[3 * i + 1];
                t[3 * i + 2] = v.z * e[3 * i + 2];
            }
            return target;
        }

        /**
         * 解决Ax = b
         * 
         * @param b 右手边
         * @param target 结果
         */
        solve(b: Vector3, target = new Vector3())
        {
            // Construct equations
            var nr = 3; // num rows
            var nc = 4; // num cols
            var eqns: number[] = [];
            for (var i = 0; i < nr * nc; i++)
            {
                eqns.push(0);
            }
            var i: number, j: number;
            for (i = 0; i < 3; i++)
            {
                for (j = 0; j < 3; j++)
                {
                    eqns[i + nc * j] = this.elements[i + 3 * j];
                }
            }
            eqns[3 + 4 * 0] = b.x;
            eqns[3 + 4 * 1] = b.y;
            eqns[3 + 4 * 2] = b.z;

            // 计算矩阵的右上三角型——高斯消去法
            var n = 3, k = n, np;
            var kp = 4; // num rows
            var p: number;
            do
            {
                i = k - n;
                if (eqns[i + nc * i] === 0)
                {
                    // the pivot is null, swap lines
                    for (j = i + 1; j < k; j++)
                    {
                        if (eqns[i + nc * j] !== 0)
                        {
                            np = kp;
                            do
                            {  // do ligne( i ) = ligne( i ) + ligne( k )
                                p = kp - np;
                                eqns[p + nc * i] += eqns[p + nc * j];
                            } while (--np);
                            break;
                        }
                    }
                }
                if (eqns[i + nc * i] !== 0)
                {
                    for (j = i + 1; j < k; j++)
                    {
                        var multiplier = eqns[i + nc * j] / eqns[i + nc * i];
                        np = kp;
                        do
                        {  // do ligne( k ) = ligne( k ) - multiplier * ligne( i )
                            p = kp - np;
                            eqns[p + nc * j] = p <= i ? 0 : eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
                        } while (--np);
                    }
                }
            } while (--n);

            // Get the solution
            target.z = eqns[2 * nc + 3] / eqns[2 * nc + 2];
            target.y = (eqns[1 * nc + 3] - eqns[1 * nc + 2] * target.z) / eqns[1 * nc + 1];
            target.x = (eqns[0 * nc + 3] - eqns[0 * nc + 2] * target.z - eqns[0 * nc + 1] * target.y) / eqns[0 * nc + 0];

            if (isNaN(target.x) || isNaN(target.y) || isNaN(target.z) || target.x === Infinity || target.y === Infinity || target.z === Infinity)
            {
                throw "Could not solve equation! Got x=[" + target.toString() + "], b=[" + b.toString() + "], A=[" + this.toString() + "]";
            }

            return target;
        }

        /**
         * 获取指定行列元素值
         * 
         * @param row 
         * @param column 
         */
        getElement(row: number, column: number)
        {
            return this.elements[column + 3 * row];
        }

        /**
         * 设置指定行列元素值
         * 
         * @param row
         * @param column
         * @param value
         */
        setElement(row: number, column: number, value: number)
        {
            this.elements[column + 3 * row] = value;
        }

        /**
         * 将另一个矩阵复制到这个矩阵对象中
         * 
         * @param source
         */
        copy(source: Matrix3x3)
        {
            for (var i = 0; i < source.elements.length; i++)
            {
                this.elements[i] = source.elements[i];
            }
            return this;
        }

        /**
         * 返回矩阵的字符串表示形式
         */
        toString()
        {
            var r = "";
            var sep = ",";
            for (var i = 0; i < 9; i++)
            {
                r += this.elements[i] + sep;
            }
            return r;
        }

        /**
         * 逆矩阵
         */
        reverse()
        {
            // Construct equations
            var nr = 3; // num rows
            var nc = 6; // num cols
            var eqns = [];
            for (var i = 0; i < nr * nc; i++)
            {
                eqns.push(0);
            }
            var i: number, j: number;
            for (i = 0; i < 3; i++)
            {
                for (j = 0; j < 3; j++)
                {
                    eqns[i + nc * j] = this.elements[i + 3 * j];
                }
            }
            eqns[3 + 6 * 0] = 1;
            eqns[3 + 6 * 1] = 0;
            eqns[3 + 6 * 2] = 0;
            eqns[4 + 6 * 0] = 0;
            eqns[4 + 6 * 1] = 1;
            eqns[4 + 6 * 2] = 0;
            eqns[5 + 6 * 0] = 0;
            eqns[5 + 6 * 1] = 0;
            eqns[5 + 6 * 2] = 1;

            // Compute right upper triangular version of the matrix - Gauss elimination
            var n = 3, k = n, np: number;
            var kp = nc; // num rows
            var p: number;
            do
            {
                i = k - n;
                if (eqns[i + nc * i] === 0)
                {
                    // the pivot is null, swap lines
                    for (j = i + 1; j < k; j++)
                    {
                        if (eqns[i + nc * j] !== 0)
                        {
                            np = kp;
                            do
                            { // do line( i ) = line( i ) + line( k )
                                p = kp - np;
                                eqns[p + nc * i] += eqns[p + nc * j];
                            } while (--np);
                            break;
                        }
                    }
                }
                if (eqns[i + nc * i] !== 0)
                {
                    for (j = i + 1; j < k; j++)
                    {
                        var multiplier = eqns[i + nc * j] / eqns[i + nc * i];
                        np = kp;
                        do
                        { // do line( k ) = line( k ) - multiplier * line( i )
                            p = kp - np;
                            eqns[p + nc * j] = p <= i ? 0 : eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
                        } while (--np);
                    }
                }
            } while (--n);

            // eliminate the upper left triangle of the matrix
            i = 2;
            do
            {
                j = i - 1;
                do
                {
                    var multiplier = eqns[i + nc * j] / eqns[i + nc * i];
                    np = nc;
                    do
                    {
                        p = nc - np;
                        eqns[p + nc * j] = eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
                    } while (--np);
                } while (j--);
            } while (--i);

            // operations on the diagonal
            i = 2;
            do
            {
                var multiplier = 1 / eqns[i + nc * i];
                np = nc;
                do
                {
                    p = nc - np;
                    eqns[p + nc * i] = eqns[p + nc * i] * multiplier;
                } while (--np);
            } while (i--);

            i = 2;
            do
            {
                j = 2;
                do
                {
                    p = eqns[nr + j + nc * i];
                    if (isNaN(p) || p === Infinity)
                    {
                        throw "Could not reverse! A=[" + this.toString() + "]";
                    }
                    this.setElement(i, j, p);
                } while (j--);
            } while (i--);

            return this;
        }

        /**
         * 逆矩阵
         */
        reverseTo(target = new Matrix3x3())
        {
            return target.copy(this).reverse();
        }

        /**
         * 从四元数设置矩阵
         * 
         * @param q
         */
        setRotationFromQuaternion(q: Quaternion)
        {
            var x = q.x, y = q.y, z = q.z, w = q.w,
                x2 = x + x, y2 = y + y, z2 = z + z,
                xx = x * x2, xy = x * y2, xz = x * z2,
                yy = y * y2, yz = y * z2, zz = z * z2,
                wx = w * x2, wy = w * y2, wz = w * z2,
                e = this.elements;

            e[3 * 0 + 0] = 1 - (yy + zz);
            e[3 * 0 + 1] = xy - wz;
            e[3 * 0 + 2] = xz + wy;

            e[3 * 1 + 0] = xy + wz;
            e[3 * 1 + 1] = 1 - (xx + zz);
            e[3 * 1 + 2] = yz - wx;

            e[3 * 2 + 0] = xz - wy;
            e[3 * 2 + 1] = yz + wx;
            e[3 * 2 + 2] = 1 - (xx + yy);

            return this;
        }

        /**
         * 转置矩阵
         */
        transpose()
        {
            var Mt = this.elements,
                M = this.elements.concat();

            for (var i = 0; i !== 3; i++)
            {
                for (var j = 0; j !== 3; j++)
                {
                    Mt[3 * i + j] = M[3 * j + i];
                }
            }

            return this;
        }

        /**
         * 转置矩阵
         */
        transposeTo(target = new Matrix3x3())
        {
            return target.copy(this).transpose();
        }

        formMatrix4x4(matrix4x4: Matrix4x4)
        {
            var m4 = matrix4x4.elements;
            var m3 = this.elements;

            m3[0] = m4[0];
            m3[1] = m4[1];
            m3[2] = m4[2];

            m3[3] = m4[4];
            m3[4] = m4[5];
            m3[5] = m4[6];

            m3[6] = m4[8];
            m3[7] = m4[9];
            m3[8] = m4[10];

            return this;
        }

        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        toArray(array: number[] = [], offset = 0)
        {
            this.elements.forEach((v, i) =>
            {
                array[offset + i] = v;
            });
            return array;
        }

        /**
         * 转换为4x4矩阵
         * 
         * @param out 4x4矩阵
         */
        toMatrix4x4(out = new Matrix4x4())
        {
            var outdata = out.elements;
            var indata = this.elements;

            outdata[0] = indata[0];
            outdata[1] = indata[1];
            outdata[2] = 0;
            outdata[3] = 0;

            outdata[4] = indata[3];
            outdata[5] = indata[4];
            outdata[6] = 0;
            outdata[7] = 0;

            outdata[8] = 0;
            outdata[9] = 0;
            outdata[10] = 1;
            outdata[11] = 0;

            outdata[12] = indata[6];
            outdata[13] = indata[7];
            outdata[14] = 0;
            outdata[15] = 1;

            return out;
        }
    }
}