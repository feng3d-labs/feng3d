QUnit.module("Queue", () =>
{
    QUnit.test("push", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var q = new ds.Queue<number>();
        q.push.apply(q, arr);

        assert.deepEqual(q.toArray(), arr);

        arr.push(1);
        q.push(1);
        assert.deepEqual(q.toArray(), arr);
    });


    QUnit.test("shift", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var q = new ds.Queue<number>();
        q.push.apply(q, arr);

        for (let i = arr.length - 1; i >= 0; i--)
        {
            assert.deepEqual(q.shift(), arr.shift());
        }

    });

    QUnit.test("toArray", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var q = new ds.Queue<number>();
        q.push.apply(q, arr);

        assert.deepEqual(q.toArray(), arr);
    });

    QUnit.test("fromArray", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var q = new ds.Queue<number>();
        q.fromArray(arr);

        assert.deepEqual(q.toArray(), arr);
    });


});