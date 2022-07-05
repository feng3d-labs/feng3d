QUnit.module("Pool", () =>
{
    QUnit.test("测试性能", (assert) =>
    {
        var NUM = 1000000;

        var pool = new feng3d.Pool(feng3d.Vector3);
        // var arr = pool.getArray(NUM);
        // pool.releaseArray(arr);

        var t = Date.now();
        for (let i = 0; i < NUM; i++)
        {
            new feng3d.Vector3();
        }
        var time0 = Date.now() - t;

        var t = Date.now();
        for (let i = 0; i < NUM; i++)
        {
            var v = pool.get();
            pool.release(v);
        }
        var time1 = Date.now() - t;

        console.log(`正常: ${time0}，pool: ${time1}`);

        assert.ok(time0 < time1);

        //
        // var t = Date.now();
        // for (let i = 0; i < NUM; i++)
        // {
        //     new feng3d.Vector3();
        // }
        // var time0 = Date.now() - t;

        // var vec3 = new feng3d.Vector3();

        // var t = Date.now();
        // for (let i = 0; i < NUM; i++)
        // {
        //     vec3.init(0, 0, 0);
        // }
        // var time1 = Date.now() - t;

        // console.log(`正常: ${time0}，pool: ${time1}`);

    });
});