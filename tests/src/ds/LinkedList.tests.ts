QUnit.module("LinkedList", () =>
{
    QUnit.test("LinkedList", (assert) =>
    {
        var ll = new ds.LinkedList<number>();
        assert.deepEqual(ll.deleteHead(), undefined);
        assert.deepEqual(ll.deleteTail(), undefined);
    });

    QUnit.test("addHead", (assert) =>
    {
        var ll = new ds.LinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        arr.concat().reverse().forEach(element =>
        {
            ll.addHead(element);
        });

        assert.deepEqual(ll.toArray(), arr);

        ll.addHead(1);
        arr.unshift(1);
        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("addTail", (assert) =>
    {
        var ll = new ds.LinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        arr.forEach(element =>
        {
            ll.addTail(element);
        });

        assert.deepEqual(ll.toArray(), arr);

        ll.addTail(1);
        arr.push(1);
        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("deleteHead", (assert) =>
    {
        var ll = new ds.LinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.fromArray(arr);

        assert.deepEqual(ll.deleteHead(), arr.shift());
        assert.deepEqual(ll.deleteHead(), arr.shift());

        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("deleteTail", (assert) =>
    {
        var ll = new ds.LinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.fromArray(arr);

        assert.deepEqual(ll.deleteTail(), arr.pop());
        assert.deepEqual(ll.deleteTail(), arr.pop());

        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("toArray", (assert) =>
    {
        var ll = new ds.LinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.fromArray(arr);

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