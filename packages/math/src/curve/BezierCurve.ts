namespace feng3d
{

    /**
     * Bézier曲线
     */
    export var bezierCurve: BezierCurve;

    /**
     * Bézier曲线
     * @see https://en.wikipedia.org/wiki/B%C3%A9zier_curve
     * @author feng / http://feng3d.com 03/06/2018
     */
    export class BezierCurve
    {
        /**
         * 线性Bézier曲线
         * 给定不同的点P0和P1，线性Bézier曲线就是这两个点之间的直线。曲线由下式给出
         * ```
         * B(t) = p0 + t * (p1 - p0) = (1 - t) * p0 + t * p1 , 0 <= t && t <= 1
         * ```
         * 相当于线性插值
         * 
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         */
        linear(t: number, p0: number, p1: number)
        {
            return p0 + t * (p1 - p0);
            // return (1 - t) * p0 + t * p1;
        }

        /**
         * 线性Bézier曲线关于t的导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         */
        linearDerivative(t: number, p0: number, p1: number)
        {
            return p1 - p0;
        }

        /**
         * 线性Bézier曲线关于t的二阶导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         */
        linearSecondDerivative(t: number, p0: number, p1: number)
        {
            return 0;
        }

        /**
         * 二次Bézier曲线
         * 
         * 二次Bézier曲线是由函数B（t）跟踪的路径，给定点P0，P1和P2，
         * ```
         * B(t) = (1 - t) * ((1 - t) * p0 + t * p1) + t * ((1 - t) * p1 + t * p2) , 0 <= t && t <= 1
         * ```
         * 这可以解释为分别从P0到P1和从P1到P2的线性Bézier曲线上相应点的线性插值。重新排列前面的等式得出：
         * ```
         * B(t) = (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2 , 0 <= t && t <= 1
         * ```
         * Bézier曲线关于t的导数是
         * ```
         * B'(t) = 2 * (1 - t) * (p1 - p0) + 2 * t * (p2 - p1)
         * ```
         * 从中可以得出结论：在P0和P2处曲线的切线在P 1处相交。随着t从0增加到1，曲线沿P1的方向从P0偏离，然后从P1的方向弯曲到P2。
         * 
         * Bézier曲线关于t的二阶导数是
         * ```
         * B''(t) = 2 * (p2 - 2 * p1 + p0)
         * ```
         * 
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         */
        quadratic(t: number, p0: number, p1: number, p2: number)
        {
            // return this.linear(t, this.linear(t, p0, p1), this.linear(t, p1, p2));
            // return (1 - t) * ((1 - t) * p0 + t * p1) + t * ((1 - t) * p1 + t * p2);
            return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
        }

        /**
         * 二次Bézier曲线关于t的导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         */
        quadraticDerivative(t: number, p0: number, p1: number, p2: number)
        {
            // return 2 * this.linear(t, this.linearDerivative(t, p0, p1), this.linearDerivative(t, p1, p2));
            return 2 * (1 - t) * (p1 - p0) + 2 * t * (p2 - p1);
        }

        /**
         * 二次Bézier曲线关于t的二阶导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         */
        quadraticSecondDerivative(t: number, p0: number, p1: number, p2: number)
        {
            // return 1 * 2 * this.linearDerivative(t, p1 - p0, p2 - p1)
            // return 1 * 2 * ((p2 - p1) - (p1 - p0));
            return 2 * (p2 - 2 * p1 + p0);
        }

        /**
         * 立方Bézier曲线
         * 
         * 平面中或高维空间中（其实一维也是成立的，这里就是使用一维计算）的四个点P0，P1，P2和P3定义了三次Bézier曲线。
         * 曲线开始于P0朝向P1并且从P2的方向到达P3。通常不会通过P1或P2; 这些点只是为了提供方向信息。
         * P1和P2之间的距离在转向P2之前确定曲线向P1移动的“多远”和“多快” 。
         * 
         * 对于由点Pi，Pj和Pk定义的二次Bézier曲线，可以将Bpipjpk(t)写成三次Bézier曲线，它可以定义为两条二次Bézier曲线的仿射组合：
         * ```
         * B(t) = (1 - t) * Bp0p1p2(t) + t * Bp1p2p3(t) , 0 <= t && t <= 1
         * ```
         * 曲线的显式形式是：
         * ```
         * B(t) = (1 - t) * (1 - t) * (1 - t) * p0 + 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t * p3 , 0 <= t && t <= 1
         * ```
         * 对于P1和P2的一些选择，曲线可以相交，或者包含尖点。
         * 
         * 三次Bézier曲线相对于t的导数是
         * ```
         * B'(t) = 3 * (1 - t) * (1 - t) * (p1 - p0) + 6 * (1 - t) * t * (p2 - p1) + 3 * t * t * (p3 - p2);
         * ```
         * 三次Bézier曲线关于t的二阶导数是
         * ```
         * 6 * (1 - t) * (p2 - 2 * p1 + p0) + 6 * t * (p3 - 2 * p2 + p1);
         * ```
         * 
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         * @param p3 点3
         */
        cubic(t: number, p0: number, p1: number, p2: number, p3: number)
        {
            // return this.linear(t, this.quadratic(t, p0, p1, p2), this.quadratic(t, p1, p2, p3));
            return (1 - t) * (1 - t) * (1 - t) * p0 + 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t * p3;
        }

        /**
         * 三次Bézier曲线关于t的导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         * @param p3 点3
         */
        cubicDerivative(t: number, p0: number, p1: number, p2: number, p3: number)
        {
            // return 3 * this.linear(t, this.quadraticDerivative(t, p0, p1, p2), this.quadraticDerivative(t, p1, p2, p3));
            return 3 * (1 - t) * (1 - t) * (p1 - p0) + 6 * (1 - t) * t * (p2 - p1) + 3 * t * t * (p3 - p2);
        }

        /**
         * 三次Bézier曲线关于t的二阶导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         */
        cubicSecondDerivative(t: number, p0: number, p1: number, p2: number, p3: number)
        {
            // return 3 * this.linear(t, this.quadraticSecondDerivative(t, p0, p1, p2), this.quadraticSecondDerivative(t, p1, p2, p3));
            return 6 * (1 - t) * (p2 - 2 * p1 + p0) + 6 * t * (p3 - 2 * p2 + p1);
        }

        /**
         * n次Bézier曲线
         * 
         * 一般定义
         * 
         * Bézier曲线可以定义为任意度n。
         * 
         * @param t 插值度
         * @param ps 点列表 ps.length == n+1
         * @param processs 收集中间过程数据，可用作Bézier曲线动画数据
         */
        bn(t: number, ps: number[], processs: number[][] = null)
        {
            ps = ps.concat();
            if (processs)
                processs.push(ps.concat());
            // n次Bézier递推
            for (let i = ps.length - 1; i > 0; i--)
            {
                for (let j = 0; j < i; j++)
                {
                    ps[j] = (1 - t) * ps[j] + t * ps[j + 1];
                }
                if (processs)
                {
                    ps.length = ps.length - 1;
                    processs.push(ps.concat());
                }
            }
            return ps[0];
        }

        /**
         * n次Bézier曲线关于t的导数
         * 
         * 一般定义
         * 
         * Bézier曲线可以定义为任意度n。
         * 
         * @param t 插值度
         * @param ps 点列表 ps.length == n+1
         */
        bnDerivative(t: number, ps: number[])
        {
            if (ps.length < 2)
                return 0;
            ps = ps.concat();
            // 进行
            for (let i = 0, n = ps.length - 1; i < n; i++)
            {
                ps[i] = ps[i + 1] - ps[i];
            }
            //
            ps.length = ps.length - 1;
            var v = ps.length * this.bn(t, ps);
            return v;
        }

        /**
         * n次Bézier曲线关于t的二阶导数
         * 
         * 一般定义
         * 
         * Bézier曲线可以定义为任意度n。
         * 
         * @param t 插值度
         * @param ps 点列表 ps.length == n+1
         */
        bnSecondDerivative(t: number, ps: number[])
        {
            if (ps.length < 3)
                return 0;
            ps = ps.concat();
            // 进行
            for (let i = 0, n = ps.length - 1; i < n; i++)
            {
                ps[i] = ps[i + 1] - ps[i];
            }
            //
            ps.length = ps.length - 1;
            var v = ps.length * this.bnDerivative(t, ps);
            return v;
        }

        /**
         * n次Bézier曲线关于t的dn阶导数
         * 
         * Bézier曲线可以定义为任意度n。
         * 
         * @param t 插值度
         * @param dn 求导次数
         * @param ps 点列表     ps.length == n+1
         */
        bnND(t: number, dn: number, ps: number[])
        {
            if (ps.length < dn + 1)
                return 0;
            var factorial = 1;
            ps = ps.concat();
            for (let j = 0; j < dn; j++)
            {
                // 进行
                for (let i = 0, n = ps.length - 1; i < n; i++)
                {
                    ps[i] = ps[i + 1] - ps[i];
                }
                //
                ps.length = ps.length - 1;
                factorial *= ps.length;
            }
            var v = factorial * this.bn(t, ps);
            return v;
        }

        /**
         * 获取曲线在指定插值度上的值
         * @param t 插值度
         * @param ps 点列表
         */
        getValue(t: number, ps: number[]): number
        {
            if (ps.length == 2)
            {
                return this.linear(t, ps[0], ps[1]);
            }
            if (ps.length == 3)
            {
                return this.quadratic(t, ps[0], ps[1], ps[2]);
            }
            if (ps.length == 4)
            {
                return this.cubic(t, ps[0], ps[1], ps[2], ps[3]);
            }
            return this.bn(t, ps);
            // var t1 = 1 - t;
            // return t1 * t1 * t1 * ps[0] + 3 * t1 * t1 * t * ps[1] + 3 * t1 * t * t * ps[2] + t * t * t * ps[3];
        }

        /**
         * 获取曲线在指定插值度上的导数(斜率)
         * @param t 插值度
         * @param ps 点列表
         */
        getDerivative(t: number, ps: number[]): number
        {
            if (ps.length == 2)
            {
                return this.linearDerivative(t, ps[0], ps[1]);
            }
            if (ps.length == 3)
            {
                return this.quadraticDerivative(t, ps[0], ps[1], ps[2]);
            }
            if (ps.length == 4)
            {
                return this.cubicDerivative(t, ps[0], ps[1], ps[2], ps[3]);
            }
            return this.bnDerivative(t, ps);
            // return 3 * (1 - t) * (1 - t) * (ps[1] - ps[0]) + 6 * (1 - t) * t * (ps[2] - ps[1]) + 3 * t * t * (ps[3] - ps[2]);
        }

        /**
         * 获取曲线在指定插值度上的二阶导数
         * @param t 插值度
         * @param ps 点列表
         */
        getSecondDerivative(t: number, ps: number[]): number
        {
            if (ps.length == 2)
            {
                return this.linearSecondDerivative(t, ps[0], ps[1]);
            }
            if (ps.length == 3)
            {
                return this.quadraticSecondDerivative(t, ps[0], ps[1], ps[2]);
            }
            if (ps.length == 4)
            {
                return this.cubicSecondDerivative(t, ps[0], ps[1], ps[2], ps[3]);
            }
            return this.bnSecondDerivative(t, ps);
            // return 3 * (1 - t) * (1 - t) * (ps[1] - ps[0]) + 6 * (1 - t) * t * (ps[2] - ps[1]) + 3 * t * t * (ps[3] - ps[2]);
        }

        /**
         * 查找区间内极值列表
         * 
         * @param ps 点列表
         * @param numSamples 采样次数，用于分段查找极值
         * @param precision  查找精度
         * 
         * @returns 极值列表 {} {ts: 极值插值度列表,vs: 极值值列表}
         */
        getExtremums(ps: number[], numSamples = 10, precision = 0.0000001)
        {
            var samples: number[] = [];
            for (let i = 0; i <= numSamples; i++)
            {
                samples.push(this.getDerivative(i / numSamples, ps));
            }
            // 查找存在解的分段
            //
            var resultTs: number[] = [];
            var resultVs: number[] = [];
            for (let i = 0, n = numSamples; i < n; i++)
            {
                if (samples[i] * samples[i + 1] < 0)
                {
                    var guessT = equationSolving.line((x) => { return this.getDerivative(x, ps); }, i / numSamples, (i + 1) / numSamples, precision);
                    resultTs.push(guessT);
                    resultVs.push(this.getValue(guessT, ps));
                }
            }
            return { ts: resultTs, vs: resultVs };
        }

        /**
         * 获取单调区间列表
         * 
         * @param ps 
         * @param numSamples 
         * @param precision 
         * @returns ts: 区间结点插值度列表,vs: 区间结点值列表
         */
        getMonotoneIntervals(ps: number[], numSamples = 10, precision = 0.0000001)
        {
            // 区间内的单调区间
            var monotoneIntervalTs = [0, 1];
            var monotoneIntervalVs = [ps[0], ps[ps.length - 1]];
            // 预先计算好极值
            var extremums = this.getExtremums(ps, numSamples, precision);
            for (let i = 0; i < extremums.ts.length; i++)
            {
                // 增加单调区间
                monotoneIntervalTs.splice(i + 1, 0, extremums.ts[i]);
                monotoneIntervalVs.splice(i + 1, 0, extremums.vs[i]);
            }
            return { ts: monotoneIntervalTs, vs: monotoneIntervalVs };
        }

        /**
         * 获取目标值所在的插值度T
         * 
         * @param targetV 目标值
         * @param ps 点列表
         * @param numSamples 分段数量，用于分段查找，用于解决寻找多个解、是否无解等问题；过少的分段可能会造成找不到存在的解决，过多的分段将会造成性能很差。
         * @param precision  查找精度
         * 
         * @returns 返回解数组
         */
        getTFromValue(targetV: number, ps: number[], numSamples = 10, precision = 0.0000001)
        {
            // 获取单调区间
            var monotoneIntervals = this.getMonotoneIntervals(ps, numSamples, precision);
            var monotoneIntervalTs = monotoneIntervals.ts;
            var monotoneIntervalVs = monotoneIntervals.vs;

            // 存在解的单调区间
            var results: number[] = [];
            // 遍历单调区间
            for (let i = 0, n = monotoneIntervalVs.length - 1; i < n; i++)
            {
                if ((monotoneIntervalVs[i] - targetV) * (monotoneIntervalVs[i + 1] - targetV) <= 0)
                {
                    var fx = (x) => { return this.getValue(x, ps) - targetV; };

                    // 连线法
                    var result = equationSolving.line(fx, monotoneIntervalTs[i], monotoneIntervalTs[i + 1], precision)
                    results.push(result);
                }
            }
            return results;
        }

        /**
         * 分割曲线
         * 
         * 在曲线插值度t位置分割为两条连接起来与原曲线完全重合的曲线
         * 
         * @param t 分割位置（插值度）
         * @param ps 被分割曲线点列表
         * @returns 返回两条曲线组成的数组
         */
        split(t: number, ps: number[])
        {
            // 获取曲线的动画过程
            var processs: number[][] = [];
            bezierCurve.bn(t, ps, processs);

            // 第一条曲线
            var fps: number[] = [];
            // 第二条曲线
            var sps: number[] = [];
            // 使用当前t值进行分割曲线
            for (let i = processs.length - 1; i >= 0; i--)
            {
                if (i == processs.length - 1)
                {
                    // 添加关键点
                    fps.push(processs[i][0]);
                    fps.push(processs[i][0]);
                } else
                {
                    // 添加左右控制点
                    fps.unshift(processs[i][0]);
                    sps.push(processs[i].pop());
                }
            }
            return [fps, sps];
        }

        /**
         * 合并曲线
         * 
         * 合并两条连接的曲线为一条曲线并且可以还原为分割前的曲线
         * 
         * @param fps 第一条曲线点列表
         * @param sps 第二条曲线点列表
         * @param mergeType 合并方式。mergeType = 0时进行还原合并，还原拆分之前的曲线；mergeType = 1时进行拟合合并，合并后的曲线会经过两条曲线的连接点；
         */
        merge(fps: number[], sps: number[], mergeType = 0)
        {
            fps = fps.concat();
            sps = sps.concat();
            var processs: number[][] = [];
            var t: number;
            // 上条曲线
            var pps: number[];
            // 当前曲线
            var ps: number[];
            for (let i = 0, n = fps.length; i < n; i++)
            {
                ps = processs[i] = [];
                if (i == 0)
                {
                    processs[i][0] = fps.pop();
                    sps.shift();
                } else if (i == 1)
                {
                    // 计算t值
                    processs[i][0] = fps.pop();
                    processs[i][1] = sps.shift();
                    t = (processs[i - 1][0] - processs[i][0]) / (processs[i][1] - processs[i][0]);
                } else
                {
                    pps = processs[i - 1];
                    // 前面增加点
                    var nfp = fps.pop();
                    // 后面增加点
                    var nsp = sps.shift();
                    // 从前往后计算
                    var ps0: number[] = [];
                    ps0[0] = nfp;
                    for (let j = 0, n = pps.length; j < n; j++)
                    {
                        ps0[j + 1] = ps0[j] + (pps[j] - ps0[j]) / t;
                    }
                    // 从后往前计算
                    var ps1: number[] = [];
                    ps1[pps.length] = nsp;
                    for (let j = pps.length - 1; j >= 0; j--)
                    {
                        ps1[j] = ps1[j + 1] - (ps1[j + 1] - pps[j]) / (1 - t);
                    }
                    // 拟合合并,合并前后两个方向的计算
                    if (mergeType == 1)
                    {
                        for (let j = 0, n = ps0.length - 1; j <= n; j++)
                        {
                            ps[j] = (ps0[j] * (n - j) + ps1[j] * j) / n;
                        }
                    } else if (mergeType == 0)
                    {
                        // 还原合并，前半段使用从前往后计算，后半段使用从后往前计算
                        for (let j = 0, n = ps0.length - 1; j <= n; j++)
                        {
                            if (j < n / 2)
                            {
                                ps[j] = ps0[j];
                            } else if (j > n / 2)
                            {
                                ps[j] = ps1[j];
                            } else
                            {
                                ps[j] = (ps0[j] + ps1[j]) / 2;
                            }
                        }
                    } else
                    {
                        console.error(`合并类型 mergeType ${mergeType} 错误!`);
                    }
                }
            }
            return processs.pop();
        }

        /**
         * 获取曲线样本数据
         * 
         * 这些点可用于连线来拟合曲线。
         * 
         * @param ps 点列表
         * @param num 采样次数 ，采样点分别为[0,1/num,2/num,....,(num-1)/num,1]
         */
        getSamples(ps: number[], num = 100)
        {
            var results: { t: number, v: number }[] = [];
            for (let i = 0; i <= num; i++)
            {
                var t = i / num;
                var p = this.getValue(t, ps)
                results.push({ t: t, v: p });
            }
            return results;
        }
    }

    bezierCurve = new BezierCurve();
}