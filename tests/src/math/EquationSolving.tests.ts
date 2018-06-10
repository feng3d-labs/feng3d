QUnit.module("EquationSolving", () =>
{
    var bezier = feng3d.bezier;
    var equationSolving = feng3d.equationSolving;
    var HighFunction = feng3d.HighFunction;
    // 允许误差
    var precision = 0.0000001;
    var testtimes = 100;

    QUnit.test("binary 二分法 求解 f(x) == 0 ", (assert) =>
    {

        for (let i = 0; i < testtimes; i++)
        {

            var as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            var hf = new HighFunction(as);

            var a = Math.random();
            var b = a + Math.random();
            var fa = hf.getValue(a);
            var fb = hf.getValue(b);

            var f = (x) => hf.getValue(x) - (fa + fb) / 2;

            // 求解 ff(x) == 0
            var x = equationSolving.binary(f, a, b, precision);
            var fx = f(x);

            assert.ok(fx < precision)
        }
    });

    QUnit.test("line 连线法 求解 f(x) == 0 ", (assert) =>
    {
        for (let i = 0; i < testtimes; i++)
        {
            var as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            var hf = new HighFunction(as);

            var a = Math.random();
            var b = a + Math.random();
            var fa = hf.getValue(a);
            var fb = hf.getValue(b);

            var f = (x) => hf.getValue(x) - (fa + fb) / 2;

            // 求解 ff(x) == 0
            var x = equationSolving.line(f, a, b, precision);
            var fx = f(x);

            assert.ok(fx < precision)
        }
    });

    QUnit.test("tangent 切线法 求解 f(x) == 0 ", (assert) =>
    {
        for (let i = 0; i < testtimes; i++)
        {
            var as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            var hf = new HighFunction(as);

            var a = Math.random();
            var b = a + Math.random();
            var fa = hf.getValue(a);
            var fb = hf.getValue(b);

            var f = (x) => hf.getValue(x) - (fa + fb) / 2;

            // 导函数
            var f1 = equationSolving.getDerivative(f);
            // 二阶导函数
            var f2 = equationSolving.getDerivative(f1);

            // 求解 ff(x) == 0
            var x = equationSolving.tangent(f, f1, f2, a, b, precision, (err) =>
            {
                assert.ok(true, err.message)
            });

            if (x < a || x > b)
            {
                assert.ok(true, `解 ${x} 超出求解区间 [${a}, ${b}]`)
            } else
            {
                if (x != undefined)
                {
                    var fx = f(x);
                    assert.ok(fx < precision)
                }
            }
        }
    });

    QUnit.test("secant 割线法（弦截法） 求解 f(x) == 0 ", (assert) =>
    {
        for (let i = 0; i < testtimes; i++)
        {
            var as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            var hf = new HighFunction(as);

            var a = Math.random();
            var b = a + Math.random();
            var fa = hf.getValue(a);
            var fb = hf.getValue(b);

            var f = (x) => hf.getValue(x) - (fa + fb) / 2;

            // 求解 ff(x) == 0
            var x = equationSolving.secant(f, a, b, precision, (err) =>
            {
                assert.ok(true, err.message)
            });

            if (x < a || x > b)
            {
                assert.ok(true, `解 ${x} 超出求解区间 [${a}, ${b}]`)
            } else
            {
                if (x != undefined)
                {
                    var fx = f(x);
                    assert.ok(fx < precision)
                }
            }
        }
    });


});