import { ok } from 'assert';
import { bezier, equationSolving } from '../src';

describe('Bezier', () =>
{
    // 允许误差
    const deviation = 0.0000001;

    it('bn linear ，使用n次Bézier计算一次Bézier曲线', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random()];
        const v0 = bezier.linear(t, ps[0], ps[1]);
        const v1 = bezier.bn(t, ps);
        ok(Math.abs(v0 - v1) < deviation);
    });

    it('bn quadratic ，使用n次Bézier计算二次Bézier曲线', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random(), Math.random()];
        const v0 = bezier.quadratic(t, ps[0], ps[1], ps[2]);
        const v1 = bezier.bn(t, ps);
        ok(Math.abs(v0 - v1) < deviation);
    });

    it('bn cubic ，使用n次Bézier计算三次Bézier曲线', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random(), Math.random(), Math.random()];
        const v0 = bezier.cubic(t, ps[0], ps[1], ps[2], ps[3]);
        const v1 = bezier.bn(t, ps);

        ok(Math.abs(v0 - v1) < deviation);

        const v2 = bezier.getValue(t, ps);
        ok(Math.abs(v0 - v2) < deviation);
    });

    it('bnD linearDerivative ，使用n次Bézier导数计算一次Bézier曲线导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random()];

        // 导数
        const d0 = bezier.linearDerivative(t, ps[0], ps[1]);
        const d1 = bezier.bnDerivative(t, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('bnD quadraticDerivative ，使用n次Bézier导数计算二次Bézier曲线导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random(), Math.random()];

        // 导数
        const d0 = bezier.quadraticDerivative(t, ps[0], ps[1], ps[2]);
        const d1 = bezier.bnDerivative(t, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('bnD cubicDerivative ，使用n次Bézier导数计算三次Bézier曲线导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random(), Math.random(), Math.random()];

        // 导数
        const d0 = bezier.cubicDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        const d1 = bezier.bnDerivative(t, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('bnSD linearSecondDerivative ，使用n次Bézier二阶导数计算一次Bézier曲线二阶导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random()];

        // 导数
        const d0 = bezier.linearSecondDerivative(t, ps[0], ps[1]);
        const d1 = bezier.bnSecondDerivative(t, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('bnSD quadraticSecondDerivative ，使用n次Bézier二阶导数计算二次Bézier曲线二阶导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random(), Math.random()];

        // 导数
        const d0 = bezier.quadraticSecondDerivative(t, ps[0], ps[1], ps[2]);
        const d1 = bezier.bnSecondDerivative(t, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('bnSD cubicSecondDerivative ，使用n次Bézier二阶导数计算三次Bézier曲线二阶导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random(), Math.random(), Math.random()];

        // 导数
        const d0 = bezier.cubicSecondDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        const d1 = bezier.bnSecondDerivative(t, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('bnND linearDerivative ，使用n次BézierN阶导数计算一次Bézier曲线导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random()];

        // 导数
        const d0 = bezier.linearDerivative(t, ps[0], ps[1]);
        const d1 = bezier.bnND(t, 1, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('bnND quadraticDerivative ，使用n次BézierN阶导数计算二次Bézier曲线导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random(), Math.random()];

        // 导数
        const d0 = bezier.quadraticDerivative(t, ps[0], ps[1], ps[2]);
        const d1 = bezier.bnND(t, 1, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('bnND cubicDerivative ，使用n次BézierN阶导数计算三次Bézier曲线导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random(), Math.random(), Math.random()];

        // 导数
        const d0 = bezier.cubicDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        const d1 = bezier.bnND(t, 1, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('bnND linearSecondDerivative ，使用n次BézierN阶导数计算一次Bézier曲线二阶导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random()];

        // 导数
        const d0 = bezier.linearSecondDerivative(t, ps[0], ps[1]);
        const d1 = bezier.bnND(t, 2, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('bnND quadraticSecondDerivative ，使用n次BézierN阶导数计算二次Bézier曲线二阶导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random(), Math.random()];

        // 导数
        const d0 = bezier.quadraticSecondDerivative(t, ps[0], ps[1], ps[2]);
        const d1 = bezier.bnND(t, 2, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('bnND cubicSecondDerivative ，使用n次BézierN阶导数计算三次Bézier曲线二阶导数', () =>
    {
        const t = Math.random();
        const ps = [Math.random(), Math.random(), Math.random(), Math.random()];

        // 导数
        const d0 = bezier.cubicSecondDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        const d1 = bezier.bnND(t, 2, ps);
        ok(Math.abs(d0 - d1) < deviation);
    });

    it('getExtremums ，查找区间内极值列表 ', () =>
    {
        for (let j = 0; j < 10; j++)
        {
            const ps = [Math.random(), Math.random(), Math.random(), Math.random()];

            // 测试高次Bézier曲线
            const n = Math.floor(Math.random() * 5);
            for (let i = 0; i < n; i++)
            {
                ps.push(Math.random());
            }

            // 查找区间内极值所在插值度列表
            const extremums = bezier.getExtremums(ps, 20, deviation);
            const ts = extremums.ts;
            const vs = extremums.vs;
            for (let i = 0, n = ts.length; i < n; i++)
            {
                ok(ts[i] >= 0 && ts[i] <= 1, `极值位置 ${ts[i]} 必须在区域 [0,1] 内`);
                // 极值
                const extremum = vs[i];
                // 极值前面的数据
                let prex = ts[i] - 0.001;
                if (i > 0) prex = bezier.linear(0.999, ts[i - 1], ts[i]);
                const prev = bezier.getValue(prex, ps);
                // 极值后面面的数据
                let nextx = ts[i] + 0.001;
                if (i < n - 1) nextx = bezier.linear(0.001, ts[i], ts[i + 1]);
                const nextv = bezier.getValue(nextx, ps);
                // 斜率
                const derivative = bezier.getDerivative(ts[i], ps);
                ok(Math.abs(derivative) < deviation, `${ps.length - 1}次Bézier曲线 第${i}个解 极值位置：${ts[i]} 斜率： ${derivative} \n 前面值： ${prev} \n 极值： ${extremum} \n 后面的值 ${nextv}`);
            }
        }
    });

    it('getTFromValue ，获取目标值所在的插值度T，返回区间内所有解', () =>
    {
        for (let j = 0; j < 10; j++)
        {
            const ps = [Math.random(), Math.random(), Math.random(), Math.random()];

            // 测试高次Bézier曲线
            const n = Math.floor(Math.random() * 5);
            for (let i = 0; i < n; i++)
            {
                ps.push(Math.random());
            }
            // 为了确保有解，去平均值
            const targetV = ps.reduce((pre, item) => pre + item, 0) / ps.length;

            const ts = bezier.getTFromValue(targetV, ps, 10, deviation);
            if (ts.length > 0)
            {
                for (let i = 0; i < ts.length; i++)
                {
                    const tv = bezier.getValue(ts[i], ps);
                    ok(Math.abs(tv - targetV) < deviation, `${ps.length - 1}次Bézier曲线 第${i}个解 目标值：${targetV} 查找到的值：${tv} 查找到的位置：${ts[i]}`);
                    ok(ts[i] >= 0 && ts[i] <= 1, `${ts[i]} 解必须在 [0,1] 区间内 `);
                }
            }
        }
    });

    it('getDerivative ，获取曲线在指定插值度上的导数(斜率)', () =>
    {
        const num = 1000;
        for (let j = 0; j < num; j++)
        {
            const ps = [Math.random(), Math.random(), Math.random(), Math.random()];

            // 测试高次Bézier曲线
            // var n = Math.floor(Math.random() * 5);
            const n = 5;
            for (let i = 0; i < n; i++)
            {
                ps.push(Math.random());
            }

            const f = (x) => bezier.getValue(x, ps);
            const f1 = equationSolving.getDerivative(f);
            //
            const t = Math.random();
            const td = bezier.getDerivative(t, ps);
            const td1 = f1(t);

            // 此处比较值不能使用太大
            ok(Math.abs(td - td1) < 0.000001);
        }
    });
});
