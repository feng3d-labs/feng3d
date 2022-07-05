QUnit.module("HighFunction", () =>
{
    var HighFunction = feng3d.HighFunction;
    // 允许误差
    var deviation = 0.0000001;

    QUnit.test("getValue 获取函数 f(x) 的值 ", (assert) =>
    {
        for (let i = 0; i < 100; i++)
        {
            var as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];

            var f = (x) =>
                as[0] * x * x * x * x * x +
                as[1] * x * x * x * x +
                as[2] * x * x * x +
                as[3] * x * x +
                as[4] * x +
                as[5];

            var hf = new HighFunction(as);

            var x = Math.random();
            var fx = f(x);
            var hfx = hf.getValue(x);
            assert.ok(Math.abs(fx - hfx) < deviation)
        }
    });
});