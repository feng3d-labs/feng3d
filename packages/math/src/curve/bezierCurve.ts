import { equationSolvingLine } from '../bezier/equationSolving';

/**
 * Bézier 曲线的**纯函数**形式（issue #134 曲线族批：原 class BezierCurve 已删除）。
 *
 * 原 class 的每个方法都是无状态的纯计算，逐方法搬成模块级函数并加 bezierCurve 前缀；
 * 方法体逐行未改。
 *
 * @see https://en.wikipedia.org/wiki/B%C3%A9zier_curve
 */

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
export function bezierCurveLinear(t: number, p0: number, p1: number)
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
export function bezierCurveLinearDerivative(t: number, p0: number, p1: number)
{
    return p1 - p0;
}

/**
 * 线性Bézier曲线关于t的二阶导数
 * @param _t 插值度
 * @param _p0 点0
 * @param _p1 点1
 */
export function bezierCurveLinearSecondDerivative(_t: number, _p0: number, _p1: number)
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
export function bezierCurveQuadratic(t: number, p0: number, p1: number, p2: number)
{
    // return bezierCurveLinear(t, bezierCurveLinear(t, p0, p1), bezierCurveLinear(t, p1, p2));
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
export function bezierCurveQuadraticDerivative(t: number, p0: number, p1: number, p2: number)
{
    // return 2 * bezierCurveLinear(t, bezierCurveLinearDerivative(t, p0, p1), bezierCurveLinearDerivative(t, p1, p2));
    return 2 * (1 - t) * (p1 - p0) + 2 * t * (p2 - p1);
}

/**
 * 二次Bézier曲线关于t的二阶导数
 * @param t 插值度
 * @param p0 点0
 * @param p1 点1
 * @param p2 点2
 */
export function bezierCurveQuadraticSecondDerivative(t: number, p0: number, p1: number, p2: number)
{
    // return 1 * 2 * bezierCurveLinearDerivative(t, p1 - p0, p2 - p1)
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
export function bezierCurveCubic(t: number, p0: number, p1: number, p2: number, p3: number)
{
    // return bezierCurveLinear(t, bezierCurveQuadratic(t, p0, p1, p2), bezierCurveQuadratic(t, p1, p2, p3));
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
export function bezierCurveCubicDerivative(t: number, p0: number, p1: number, p2: number, p3: number)
{
    // return 3 * bezierCurveLinear(t, bezierCurveQuadraticDerivative(t, p0, p1, p2), bezierCurveQuadraticDerivative(t, p1, p2, p3));
    return 3 * (1 - t) * (1 - t) * (p1 - p0) + 6 * (1 - t) * t * (p2 - p1) + 3 * t * t * (p3 - p2);
}

/**
 * 三次Bézier曲线关于t的二阶导数
 * @param t 插值度
 * @param p0 点0
 * @param p1 点1
 * @param p2 点2
 */
export function bezierCurveCubicSecondDerivative(t: number, p0: number, p1: number, p2: number, p3: number)
{
    // return 3 * bezierCurveLinear(t, bezierCurveQuadraticSecondDerivative(t, p0, p1, p2), bezierCurveQuadraticSecondDerivative(t, p1, p2, p3));
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
 * @param ps 点列表 ps.length === n+1
 * @param processs 收集中间过程数据，可用作Bézier曲线动画数据
 */
export function bezierCurveBn(t: number, ps: number[], processs?: number[][])
{
    ps = ps.concat();
    if (processs)
    { processs.push(ps.concat()); }
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
 * @param ps 点列表 ps.length === n+1
 */
export function bezierCurveBnDerivative(t: number, ps: number[])
{
    if (ps.length < 2)
    { return 0; }
    ps = ps.concat();
    // 进行
    for (let i = 0, n = ps.length - 1; i < n; i++)
    {
        ps[i] = ps[i + 1] - ps[i];
    }
    //
    ps.length = ps.length - 1;
    const v = ps.length * bezierCurveBn(t, ps);

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
 * @param ps 点列表 ps.length === n+1
 */
export function bezierCurveBnSecondDerivative(t: number, ps: number[])
{
    if (ps.length < 3)
    { return 0; }
    ps = ps.concat();
    // 进行
    for (let i = 0, n = ps.length - 1; i < n; i++)
    {
        ps[i] = ps[i + 1] - ps[i];
    }
    //
    ps.length = ps.length - 1;
    const v = ps.length * bezierCurveBnDerivative(t, ps);

    return v;
}

/**
 * n次Bézier曲线关于t的dn阶导数
 *
 * Bézier曲线可以定义为任意度n。
 *
 * @param t 插值度
 * @param dn 求导次数
 * @param ps 点列表     ps.length === n+1
 */
export function bezierCurveBnND(t: number, dn: number, ps: number[])
{
    if (ps.length < dn + 1)
    { return 0; }
    let factorial = 1;

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
    const v = factorial * bezierCurveBn(t, ps);

    return v;
}

/**
 * 获取曲线在指定插值度上的值
 * @param t 插值度
 * @param ps 点列表
 */
export function bezierCurveGetValue(t: number, ps: number[]): number
{
    if (ps.length === 2)
    {
        return bezierCurveLinear(t, ps[0], ps[1]);
    }
    if (ps.length === 3)
    {
        return bezierCurveQuadratic(t, ps[0], ps[1], ps[2]);
    }
    if (ps.length === 4)
    {
        return bezierCurveCubic(t, ps[0], ps[1], ps[2], ps[3]);
    }

    return bezierCurveBn(t, ps);
    // var t1 = 1 - t;
    // return t1 * t1 * t1 * ps[0] + 3 * t1 * t1 * t * ps[1] + 3 * t1 * t * t * ps[2] + t * t * t * ps[3];
}

/**
 * 获取曲线在指定插值度上的导数(斜率)
 * @param t 插值度
 * @param ps 点列表
 */
export function bezierCurveGetDerivative(t: number, ps: number[]): number
{
    if (ps.length === 2)
    {
        return bezierCurveLinearDerivative(t, ps[0], ps[1]);
    }
    if (ps.length === 3)
    {
        return bezierCurveQuadraticDerivative(t, ps[0], ps[1], ps[2]);
    }
    if (ps.length === 4)
    {
        return bezierCurveCubicDerivative(t, ps[0], ps[1], ps[2], ps[3]);
    }

    return bezierCurveBnDerivative(t, ps);
    // return 3 * (1 - t) * (1 - t) * (ps[1] - ps[0]) + 6 * (1 - t) * t * (ps[2] - ps[1]) + 3 * t * t * (ps[3] - ps[2]);
}

/**
 * 获取曲线在指定插值度上的二阶导数
 * @param t 插值度
 * @param ps 点列表
 */
export function bezierCurveGetSecondDerivative(t: number, ps: number[]): number
{
    if (ps.length === 2)
    {
        return bezierCurveLinearSecondDerivative(t, ps[0], ps[1]);
    }
    if (ps.length === 3)
    {
        return bezierCurveQuadraticSecondDerivative(t, ps[0], ps[1], ps[2]);
    }
    if (ps.length === 4)
    {
        return bezierCurveCubicSecondDerivative(t, ps[0], ps[1], ps[2], ps[3]);
    }

    return bezierCurveBnSecondDerivative(t, ps);
    // return 3 * (1 - t) * (1 - t) * (ps[1] - ps[0]) + 6 * (1 - t) * t * (ps[2] - ps[1]) + 3 * t * t * (ps[3] - ps[2]);
}

/**
 * 查找区间内极值列表
 *
 * @param ps 点列表
 * @param numSamples 采样次数，用于分段查找极值
 * @param precision 查找精度
 *
 * @returns 极值列表 {} {ts: 极值插值度列表,vs: 极值值列表}
 */
export function bezierCurveGetExtremums(ps: number[], numSamples = 10, precision = 0.0000001)
{
    const samples: number[] = [];

    for (let i = 0; i <= numSamples; i++)
    {
        samples.push(bezierCurveGetDerivative(i / numSamples, ps));
    }
    // 查找存在解的分段
    //
    const resultTs: number[] = [];
    const resultVs: number[] = [];

    for (let i = 0, n = numSamples; i < n; i++)
    {
        if (samples[i] * samples[i + 1] < 0)
        {
            // samples 两端异号说明该分段内必有解，equationSolvingLine 不会返回 undefined；?? Number.NaN 仅是类型兜底
            const guessT = equationSolvingLine((x) => bezierCurveGetDerivative(x, ps), i / numSamples, (i + 1) / numSamples, precision) ?? Number.NaN;

            resultTs.push(guessT);
            resultVs.push(bezierCurveGetValue(guessT, ps));
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
export function bezierCurveGetMonotoneIntervals(ps: number[], numSamples = 10, precision = 0.0000001)
{
    // 区间内的单调区间
    const monotoneIntervalTs = [0, 1];
    const monotoneIntervalVs = [ps[0], ps[ps.length - 1]];
    // 预先计算好极值
    const extremums = bezierCurveGetExtremums(ps, numSamples, precision);

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
 * @param precision 查找精度
 *
 * @returns 返回解数组
 */
export function bezierCurveGetTFromValue(targetV: number, ps: number[], numSamples = 10, precision = 0.0000001)
{
    // 获取单调区间
    const monotoneIntervals = bezierCurveGetMonotoneIntervals(ps, numSamples, precision);
    const monotoneIntervalTs = monotoneIntervals.ts;
    const monotoneIntervalVs = monotoneIntervals.vs;

    // 存在解的单调区间
    const results: number[] = [];
    // 遍历单调区间

    for (let i = 0, n = monotoneIntervalVs.length - 1; i < n; i++)
    {
        if ((monotoneIntervalVs[i] - targetV) * (monotoneIntervalVs[i + 1] - targetV) <= 0)
        {
            const fx = (x) => bezierCurveGetValue(x, ps) - targetV;

            // 连线法
            const result = equationSolvingLine(fx, monotoneIntervalTs[i], monotoneIntervalTs[i + 1], precision);

            // 区间两端函数值异号，方程必有解，equationSolvingLine 不会返回 undefined
            results.push(result ?? Number.NaN);
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
export function bezierCurveSplit(t: number, ps: number[])
{
    // 获取曲线的动画过程
    const processs: number[][] = [];

    bezierCurveBn(t, ps, processs);

    // 第一条曲线
    const fps: number[] = [];
    // 第二条曲线
    const sps: number[] = [];
    // 使用当前t值进行分割曲线

    for (let i = processs.length - 1; i >= 0; i--)
    {
        if (i === processs.length - 1)
        {
            // 添加关键点
            fps.push(processs[i][0]);
            fps.push(processs[i][0]);
        }
        else
        {
            // 添加左右控制点
            fps.unshift(processs[i][0]);
            // 非最后一个元素在上一轮已被 length-1 缩短，长度至少为 2，pop 必有值
            sps.push(processs[i].pop()!);
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
export function bezierCurveMerge(fps: number[], sps: number[], mergeType = 0)
{
    fps = fps.concat();
    sps = sps.concat();
    const processs: number[][] = [];
    // 原实现此处 t 未赋值，参与算术会得到 NaN；显式初始化为 NaN 以保持运行时行为不变
    let t: number = Number.NaN;
    // 上条曲线
    let pps: number[];
    // 当前曲线
    let ps: number[];

    for (let i = 0, n = fps.length; i < n; i++)
    {
        ps = processs[i] = [];
        if (i === 0)
        {
            // 循环轮数等于进入循环时的 fps.length，每轮 pop 必有值
            processs[i][0] = fps.pop()!;
            sps.shift();
        }
        else if (i === 1)
        {
            // 计算t值
            // 循环轮数等于进入循环时的 fps.length，每轮 pop 必有值
            processs[i][0] = fps.pop()!;
            // 与 fps.pop 成对调用，sps 由调用方按同长度传入；! 不改变运行时取值
            processs[i][1] = sps.shift()!;
            t = (processs[i - 1][0] - processs[i][0]) / (processs[i][1] - processs[i][0]);
        }
        else
        {
            pps = processs[i - 1];
            // 前面增加点；循环轮数等于进入循环时的 fps.length，每轮 pop 必有值
            const nfp = fps.pop()!;
            // 后面增加点；与 fps.pop 成对调用，sps 由调用方按同长度传入；! 不改变运行时取值
            const nsp = sps.shift()!;
            // 从前往后计算
            const ps0: number[] = [];

            ps0[0] = nfp;
            for (let j = 0, n = pps.length; j < n; j++)
            {
                ps0[j + 1] = ps0[j] + (pps[j] - ps0[j]) / t;
            }
            // 从后往前计算
            const ps1: number[] = [];

            ps1[pps.length] = nsp;
            for (let j = pps.length - 1; j >= 0; j--)
            {
                ps1[j] = ps1[j + 1] - (ps1[j + 1] - pps[j]) / (1 - t);
            }
            // 拟合合并,合并前后两个方向的计算
            if (mergeType === 1)
            {
                for (let j = 0, n = ps0.length - 1; j <= n; j++)
                {
                    ps[j] = (ps0[j] * (n - j) + ps1[j] * j) / n;
                }
            }
            else if (mergeType === 0)
            {
                // 还原合并，前半段使用从前往后计算，后半段使用从后往前计算
                for (let j = 0, n = ps0.length - 1; j <= n; j++)
                {
                    if (j < n / 2)
                    {
                        ps[j] = ps0[j];
                    }
                    else if (j > n / 2)
                    {
                        ps[j] = ps1[j];
                    }
                    else
                    {
                        ps[j] = (ps0[j] + ps1[j]) / 2;
                    }
                }
            }
            else
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
export function bezierCurveGetSamples(ps: number[], num = 100)
{
    const results: { t: number, v: number }[] = [];

    for (let i = 0; i <= num; i++)
    {
        const t = i / num;
        const p = bezierCurveGetValue(t, ps);

        results.push({ t, v: p });
    }

    return results;
}
