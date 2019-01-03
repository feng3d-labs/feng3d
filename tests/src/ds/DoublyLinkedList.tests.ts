QUnit.module("DoublyLinkedList", () =>
{
    QUnit.test("DoublyLinkedList", (assert) =>
    {
        var ll = new ds.DoublyLinkedList<number>();
        assert.deepEqual(ll.deleteHead(), undefined);
        assert.deepEqual(ll.deleteTail(), undefined);
    });

    QUnit.test("empty", (assert) =>
    {
        var ll = new ds.DoublyLinkedList<number>();
        ll.fromArray([Math.random(), Math.random(), Math.random()]);
        ll.empty();
        assert.deepEqual(ll.toArray().length, 0);
    });

    QUnit.test("addHead", (assert) =>
    {
        var ll = new ds.DoublyLinkedList<number>();
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
        var ll = new ds.DoublyLinkedList<number>();

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
        var ll = new ds.DoublyLinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.fromArray(arr);

        assert.deepEqual(ll.deleteHead(), arr.shift());
        assert.deepEqual(ll.deleteHead(), arr.shift());

        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("deleteTail", (assert) =>
    {
        var ll = new ds.DoublyLinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.fromArray(arr);

        assert.deepEqual(ll.deleteTail(), arr.pop());
        assert.deepEqual(ll.deleteTail(), arr.pop());

        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("toArray", (assert) =>
    {
        var ll = new ds.DoublyLinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.fromArray(arr);

        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("fromArray", (assert) =>
    {
        var ll = new ds.DoublyLinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.fromArray(arr);

        assert.deepEqual(ll.toArray(), arr);
    });

    QUnit.test("toString", (assert) =>
    {
        var ll = new ds.DoublyLinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.fromArray(arr);

        assert.ok(true, ll.toString((v) => v.toFixed(3)));
    });

    QUnit.test("reverse", (assert) =>
    {
        var ll = new ds.DoublyLinkedList<number>();

        var arr = ds.utils.createArray(10, () => Math.random());
        ll.fromArray(arr);

        ll.reverse();
        arr.reverse();

        assert.deepEqual(ll.toArray(), arr);

        arr.length = 1;
        ll.fromArray(arr);

        ll.reverse();
        arr.reverse();

        assert.deepEqual(ll.toArray(), arr);
    });
});