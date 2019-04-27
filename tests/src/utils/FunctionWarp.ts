interface FF
{
    (a, b): void;
}

QUnit.module("FunctionWarp", () =>
{
    QUnit.test("FunctionWarp ", (assert) =>
    {
        var o = {
            v: 1, f: function (a)
            {
                this.v = this.v + a;
            }
        };

        // 添加函数在指定函数之前执行
        feng3d.functionwarp.wrap(o, "f", function (a)
        {
            this.v = 0;
        })
        var v = Math.random();
        o.f(v);
        assert.ok(o.v == v);

        // 添加函数在指定函数之后执行
        feng3d.functionwarp.wrap(o, "f", function (a)
        {
            this.v = 0;
        }, false)
        var v = Math.random();
        o.f(v);
        assert.ok(o.v == 0);

        assert.ok(o[feng3d.__functionwarp__]);

        

    });
});