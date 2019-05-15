QUnit.module("Bezier", () =>
{
    var bezier = feng3d.bezierCurve;
    var equationSolving = feng3d.equationSolving;
    // 允许误差
    var deviation = 0.0000001;

    QUnit.test("bn linear ，使用n次Bézier计算一次Bézier曲线", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random()];
        var v0 = bezier.linear(t, ps[0], ps[1]);
        var v1 = bezier.bn(t, ps);
        assert.ok(Math.abs(v0 - v1) < deviation);
    });

    QUnit.test("bn quadratic ，使用n次Bézier计算二次Bézier曲线", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random()];
        var v0 = bezier.quadratic(t, ps[0], ps[1], ps[2]);
        var v1 = bezier.bn(t, ps);
        assert.ok(Math.abs(v0 - v1) < deviation);
    });

    QUnit.test("bn cubic ，使用n次Bézier计算三次Bézier曲线", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random(), Math.random()];
        var v0 = bezier.cubic(t, ps[0], ps[1], ps[2], ps[3]);
        var v1 = bezier.bn(t, ps);

        assert.ok(Math.abs(v0 - v1) < deviation);

        var v2 = bezier.getValue(t, ps);
        assert.ok(Math.abs(v0 - v2) < deviation);
    });

    QUnit.test("bnD linearDerivative ，使用n次Bézier导数计算一次Bézier曲线导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random()];

        // 导数
        var d0 = bezier.linearDerivative(t, ps[0], ps[1]);
        var d1 = bezier.bnDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("bnD quadraticDerivative ，使用n次Bézier导数计算二次Bézier曲线导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random()];

        // 导数
        var d0 = bezier.quadraticDerivative(t, ps[0], ps[1], ps[2]);
        var d1 = bezier.bnDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("bnD cubicDerivative ，使用n次Bézier导数计算三次Bézier曲线导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random(), Math.random()];

        // 导数
        var d0 = bezier.cubicDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        var d1 = bezier.bnDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("bnSD linearSecondDerivative ，使用n次Bézier二阶导数计算一次Bézier曲线二阶导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random()];

        // 导数
        var d0 = bezier.linearSecondDerivative(t, ps[0], ps[1]);
        var d1 = bezier.bnSecondDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("bnSD quadraticSecondDerivative ，使用n次Bézier二阶导数计算二次Bézier曲线二阶导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random()];

        // 导数
        var d0 = bezier.quadraticSecondDerivative(t, ps[0], ps[1], ps[2]);
        var d1 = bezier.bnSecondDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("bnSD cubicSecondDerivative ，使用n次Bézier二阶导数计算三次Bézier曲线二阶导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random(), Math.random()];

        // 导数
        var d0 = bezier.cubicSecondDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        var d1 = bezier.bnSecondDerivative(t, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("bnND linearDerivative ，使用n次BézierN阶导数计算一次Bézier曲线导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random()];

        // 导数
        var d0 = bezier.linearDerivative(t, ps[0], ps[1]);
        var d1 = bezier.bnND(t, 1, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("bnND quadraticDerivative ，使用n次BézierN阶导数计算二次Bézier曲线导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random()];

        // 导数
        var d0 = bezier.quadraticDerivative(t, ps[0], ps[1], ps[2]);
        var d1 = bezier.bnND(t, 1, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("bnND cubicDerivative ，使用n次BézierN阶导数计算三次Bézier曲线导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random(), Math.random()];

        // 导数
        var d0 = bezier.cubicDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        var d1 = bezier.bnND(t, 1, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("bnND linearSecondDerivative ，使用n次BézierN阶导数计算一次Bézier曲线二阶导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random()];

        // 导数
        var d0 = bezier.linearSecondDerivative(t, ps[0], ps[1]);
        var d1 = bezier.bnND(t, 2, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("bnND quadraticSecondDerivative ，使用n次BézierN阶导数计算二次Bézier曲线二阶导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random()];

        // 导数
        var d0 = bezier.quadraticSecondDerivative(t, ps[0], ps[1], ps[2]);
        var d1 = bezier.bnND(t, 2, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("bnND cubicSecondDerivative ，使用n次BézierN阶导数计算三次Bézier曲线二阶导数", (assert) =>
    {
        var t = Math.random();
        var ps = [Math.random(), Math.random(), Math.random(), Math.random()];

        // 导数
        var d0 = bezier.cubicSecondDerivative(t, ps[0], ps[1], ps[2], ps[3]);
        var d1 = bezier.bnND(t, 2, ps);
        assert.ok(Math.abs(d0 - d1) < deviation);
    });

    QUnit.test("getExtremums ，查找区间内极值列表 ", (assert) =>
    {
        for (let j = 0; j < 10; j++)
        {
            var ps = [Math.random(), Math.random(), Math.random(), Math.random()];

            // 测试高次Bézier曲线
            var n = Math.floor(Math.random() * 5);
            for (let i = 0; i < n; i++)
            {
                ps.push(Math.random());
            }

            // 查找区间内极值所在插值度列表
            var extremums = bezier.getExtremums(ps, 20, deviation);
            var ts = extremums.ts;
            var vs = extremums.vs;
            for (let i = 0, n = ts.length; i < n; i++)
            {
                assert.ok(0 <= ts[i] && ts[i] <= 1, `极值位置 ${ts[i]} 必须在区域 [0,1] 内`);
                // 极值
                var extremum = vs[i];
                // 极值前面的数据
                var prex = ts[i] - 0.001;
                if (0 < i) prex = bezier.linear(0.999, ts[i - 1], ts[i]);
                var prev = bezier.getValue(prex, ps);
                // 极值后面面的数据
                var nextx = ts[i] + 0.001;
                if (i < n - 1) nextx = bezier.linear(0.001, ts[i], ts[i + 1]);
                var nextv = bezier.getValue(nextx, ps);
                // 斜率
                var derivative = bezier.getDerivative(ts[i], ps);
                assert.ok(Math.abs(derivative) < deviation, `${ps.length - 1}次Bézier曲线 第${i}个解 极值位置：${ts[i]} 斜率： ${derivative} \n 前面值： ${prev} \n 极值： ${extremum} \n 后面的值 ${nextv}`);
            }
        }
    });

    QUnit.test("getTFromValue ，获取目标值所在的插值度T，返回区间内所有解", (assert) =>
    {
        for (let j = 0; j < 10; j++)
        {
            var ps = [Math.random(), Math.random(), Math.random(), Math.random()];

            // 测试高次Bézier曲线
            var n = Math.floor(Math.random() * 5);
            for (let i = 0; i < n; i++)
            {
                ps.push(Math.random());
            }
            // 为了确保有解，去平均值
            var targetV = ps.reduce((pre, item) => pre + item, 0) / ps.length;

            var ts = bezier.getTFromValue(targetV, ps, 10, deviation);
            if (ts.length > 0)
            {
                for (let i = 0; i < ts.length; i++)
                {
                    var tv = bezier.getValue(ts[i], ps);
                    assert.ok(Math.abs(tv - targetV) < deviation, `${ps.length - 1}次Bézier曲线 第${i}个解 目标值：${targetV} 查找到的值：${tv} 查找到的位置：${ts[i]}`);
                    assert.ok(0 <= ts[i] && ts[i] <= 1, `${ts[i]} 解必须在 [0,1] 区间内 `);
                }
            }
        }
    });

    QUnit.test("getDerivative ，获取曲线在指定插值度上的导数(斜率)", (assert) =>
    {
        var num = 1000;
        for (let j = 0; j < num; j++)
        {
            var ps = [Math.random(), Math.random(), Math.random(), Math.random()];

            // 测试高次Bézier曲线
            // var n = Math.floor(Math.random() * 5);
            var n = 5;
            for (let i = 0; i < n; i++)
            {
                ps.push(Math.random());
            }

            var f = (x) => bezier.getValue(x, ps);
            var f1 = equationSolving.getDerivative(f);
            //
            var t = Math.random();
            var td = bezier.getDerivative(t, ps);
            var td1 = f1(t);

            // 此处比较值不能使用太大
            assert.ok(Math.abs(td - td1) < 0.000001);
        }
    });
});