QUnit.module("LinkedList", () =>
{
    QUnit.test("LinkedList", (assert) =>
    {
        var ll = new ds.LinkedList<number>();
        assert.deepEqual(ll.shift(), undefined);
        assert.deepEqual(ll.pop(), undefined);
    });

    QUnit.test("unshift", (assert) =>
    {
        var ll = new ds.LinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.unshift.apply(ll, arr);

        assert.deepEqual(ll.toArray(), arr);

        ll.unshift(1);
        arr.unshift(1);
        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("push", (assert) =>
    {
        var ll = new ds.LinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.push.apply(ll, arr);

        assert.deepEqual(ll.toArray(), arr);

        ll.push(1);
        arr.push(1);
        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("shift", (assert) =>
    {
        var ll = new ds.LinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.push.apply(ll, arr);

        assert.deepEqual(ll.toArray(), arr);

        assert.deepEqual(ll.shift(), arr.shift());
        assert.deepEqual(ll.shift(), arr.shift());

        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("pop", (assert) =>
    {
        var ll = new ds.LinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.push.apply(ll, arr);

        assert.deepEqual(ll.toArray(), arr);

        assert.deepEqual(ll.pop(), arr.pop());
        assert.deepEqual(ll.pop(), arr.pop());

        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("toArray", (assert) =>
    {
        var ll = new ds.LinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.push.apply(ll, arr);

        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("fromArray", (assert) =>
    {
        var ll = new ds.LinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.fromArray(arr);

        assert.deepEqual(ll.toArray(), arr);
    });
});