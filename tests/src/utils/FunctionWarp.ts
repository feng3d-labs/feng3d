interface FF
{
    (a, b): void;
}

QUnit.module("FunctionWrap", () =>
{
    QUnit.test("wrap & unwrap ", (assert) =>
    {
        var o = {
            v: 1, f: function (a)
            {
                this.v = this.v + a;
            }
        };

        function wrapFunc(a)
        {
            this.v = 0;
        }

        // 添加函数在指定函数之前执行
        feng3d.functionwrap.wrap(o, "f", wrapFunc)
        var v = Math.random();
        o.f(v);
        assert.ok(o.v == v);

        // 添加函数在指定函数之后执行
        feng3d.functionwrap.wrap(o, "f", wrapFunc, false)
        var v = Math.random();
        o.f(v);
        assert.ok(o.v == 0);

        assert.ok(o[feng3d.__functionwrap__]);

        feng3d.functionwrap.unwrap(o, "f", wrapFunc);
        assert.ok(!o[feng3d.__functionwrap__]);

        o.v = 0;
        var v = Math.random();
        o.f(v);
        assert.ok(o.v == v);


        var vec2 = new feng3d.Vector2();

        var propertyDescriptor = Object.getOwnPropertyDescriptor(vec2, "sub");

        feng3d.functionwrap.wrap(vec2, "sub", (v: feng3d.Vector2) => { v.init(0, 0); return null; })
        assert.ok(vec2[feng3d.__functionwrap__]);

        feng3d.functionwrap.unwrap(vec2, "sub")
        assert.ok(!vec2[feng3d.__functionwrap__]);


        var propertyDescriptor1 = Object.getOwnPropertyDescriptor(vec2, "sub");
        assert.deepEqual(propertyDescriptor, propertyDescriptor1)
    });

    QUnit.test("wrapAsyncFunc", (assert) =>
    {
        var done = assert.async();

        // 执行次数
        var executions = 0;

        // 异步函数
        function af(a: number, callback: (r: number) => void = (() => { }))
        {
            setTimeout(() =>
            {
                executions++;
                callback(a * a);
            }, Math.randInt(10, 50));
        }

        // 包装后的函数
        function wrapFunc(a: number, callback: (r: number) => void)
        {
            feng3d.functionwrap.wrapAsyncFunc(null, af, [1], callback);
        }

        // 测试同时调用五次 af 函数
        function testAfs(callback: () => void)
        {
            executions = 0;
            var callbackTime = 0;
            var fns = new Array(5).fill(5).map(v => (callback) => af(v, () =>
            {
                callbackTime++;
                callback();
            }));

            // 同时调用五次函数并等待完成
            feng3d.task.parallel(fns)(() =>
            {
                // af 函数 执行5次
                assert.equal(executions, 5);
                // 回调执行5次
                assert.equal(callbackTime, 5);
                callback();
            });
        }

        // 测试同时五次调用 wrapFunc 函数
        function testWrapFuncs(callback: () => void)
        {
            executions = 0;
            var callbackTime = 0;
            var fns = new Array(5).fill(5).map(v => (callback) => wrapFunc(v, () =>
            {
                callbackTime++;
                callback();
            }));
            // 同时调用五次函数并等待完成
            feng3d.task.parallel(fns)(() =>
            {
                // af 函数 执行1次
                assert.equal(executions, 1);
                // 回调执行5次
                assert.equal(callbackTime, 5);
                callback();
            });
        }

        // 串联（依次）执行两个测试函数
        feng3d.task.series([testAfs, testWrapFuncs])(() =>
        {
            done();
        });
    });
});