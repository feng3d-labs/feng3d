QUnit.module("PriorityQueue", () =>
{
    QUnit.test("push", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var compare = (a: number, b: number) => a - b;
        var q = new ds.PriorityQueue(compare);
        q.push.apply(q, arr);

        var sortarr = arr.concat().sort(compare);
        assert.deepEqual(q.toArray(), sortarr);

        arr.push(1);
        q.push(1);
        sortarr = arr.concat().sort();
        assert.deepEqual(q.toArray(), sortarr);
    });

    QUnit.test("shift", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var compare = (a: number, b: number) => a - b;
        var q = new ds.PriorityQueue(compare);
        q.push.apply(q, arr);

        var sortarr = arr.concat().sort(compare);

        for (let i = sortarr.length - 1; i >= 0; i--)
        {
            assert.deepEqual(q.shift(), sortarr.shift());
        }

    });

    QUnit.test("toArray", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var compare = (a: number, b: number) => a - b;
        var q = new ds.PriorityQueue(compare);
        q.push.apply(q, arr);

        var sortarr = arr.concat().sort(compare);

        assert.deepEqual(q.toArray(), sortarr);
    });

    QUnit.test("fromArray", (assert) =>
    {
        var arr = ds.utils.createArray(10, () => Math.random());

        var compare = (a: number, b: number) => a - b;
        var q = new ds.PriorityQueue(compare);
        q.fromArray(arr);

        var sortarr = arr.concat().sort(compare);
        assert.deepEqual(q.toArray(), sortarr);
    });


});