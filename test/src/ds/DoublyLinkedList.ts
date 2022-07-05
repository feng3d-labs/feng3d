QUnit.module("DoublyLinkedList", () =>
{
    QUnit.test("DoublyLinkedList", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();
        assert.deepEqual(ll.deleteHead(), undefined);
        assert.deepEqual(ll.deleteTail(), undefined);

        assert.ok(ll.checkStructure());
    });

    QUnit.test("empty", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();
        ll.fromArray([Math.random(), Math.random(), Math.random()]);
        ll.empty();
        assert.deepEqual(ll.toArray().length, 0);

        assert.ok(ll.checkStructure());
    });

    QUnit.test("addHead", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();
        var arr = Array.create(10, () => Math.random());
        arr.concat().reverse().forEach(element =>
        {
            ll.addHead(element);
        });
        assert.deepEqual(ll.toArray(), arr);

        ll.addHead(1);
        arr.unshift(1);
        assert.deepEqual(ll.toArray(), arr);

        assert.ok(ll.checkStructure());
    });


    QUnit.test("addTail", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();

        var arr = Array.create(10, () => Math.random());
        arr.forEach(element =>
        {
            ll.addTail(element);
        });

        assert.deepEqual(ll.toArray(), arr);

        ll.addTail(1);
        arr.push(1);
        assert.deepEqual(ll.toArray(), arr);

        assert.ok(ll.checkStructure());
    });


    QUnit.test("delete", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();

        var arr = Array.create(10, () => Math.random());
        arr = arr.concat(arr);
        arr.forEach(element =>
        {
            ll.addTail(element);
        });

        assert.deepEqual(ll.toArray(), arr);

        var deleteItem = arr[3];
        arr.splice(arr.indexOf(deleteItem), 1);

        ll.delete(deleteItem);

        assert.deepEqual(ll.toArray(), arr);

        assert.ok(ll.checkStructure());
    });

    QUnit.test("deleteAll", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();

        var arr = Array.create(10, () => Math.random());
        arr = arr.concat(arr);
        arr.forEach(element =>
        {
            ll.addTail(element);
        });

        assert.deepEqual(ll.toArray(), arr);

        var deleteItem = arr[3];

        var index = arr.indexOf(deleteItem);
        while (index != -1)
        {
            arr.splice(index, 1);
            index = arr.indexOf(deleteItem);
        }
        ll.deleteAll(deleteItem);

        assert.deepEqual(ll.toArray(), arr);

        assert.ok(ll.checkStructure());
    });

    QUnit.test("deleteHead", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();

        var arr = Array.create(10, () => Math.random());
        ll.fromArray(arr);

        assert.deepEqual(ll.deleteHead(), arr.shift());
        assert.deepEqual(ll.deleteHead(), arr.shift());

        assert.deepEqual(ll.toArray(), arr);

        assert.ok(ll.checkStructure());
    });

    QUnit.test("deleteTail", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();

        var arr = Array.create(10, () => Math.random());
        ll.fromArray(arr);

        assert.deepEqual(ll.deleteTail(), arr.pop());
        assert.deepEqual(ll.deleteTail(), arr.pop());

        assert.deepEqual(ll.toArray(), arr);

        assert.ok(ll.checkStructure());
    });

    QUnit.test("toArray", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();

        var arr = Array.create(10, () => Math.random());
        ll.fromArray(arr);

        assert.deepEqual(ll.toArray(), arr);

        assert.ok(ll.checkStructure());
    });

    QUnit.test("fromArray", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();

        var arr = Array.create(10, () => Math.random());
        ll.fromArray(arr);

        assert.deepEqual(ll.toArray(), arr);

        assert.ok(ll.checkStructure());
    });

    QUnit.test("toString", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();

        var arr = Array.create(10, () => Math.random());
        ll.fromArray(arr);

        assert.ok(true, ll.toString((v) => v.toFixed(3)));

        assert.ok(ll.checkStructure());
    });

    QUnit.test("reverse", (assert) =>
    {
        var ll = new feng3d.DoublyLinkedList<number>();

        var arr = Array.create(10, () => Math.random());
        ll.fromArray(arr);

        ll.reverse();
        arr.reverse();

        assert.deepEqual(ll.toArray(), arr);

        arr.length = 1;
        ll.fromArray(arr);

        ll.reverse();
        arr.reverse();

        assert.deepEqual(ll.toArray(), arr);

        assert.ok(ll.checkStructure());
    });
});