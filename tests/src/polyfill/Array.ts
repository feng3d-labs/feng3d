QUnit.module("Array", () =>
{
    QUnit.test("equal", (assert) =>
    {
        assert.ok([1, 2, 3].equal([1, 2, 3]));

        assert.ok(![{}, 2, 3].equal([{}, 2, 3]));

        var obj = {};
        assert.ok([obj, 2, 3].equal([obj, 2, 3]));
    });

    QUnit.test("concatToSelf", (assert) =>
    {
        var arr = [0];
        arr.concatToSelf(1, 2, 3, [4, 5, 6], 7, 8, 9);

        var arr1 = Array(10).fill(0).map((v, i) => i);

        assert.ok(arr.equal(arr1));
    });

    QUnit.test("unique", (assert) =>
    {
        var arr1 = Array(10000).fill(0).map((v, i) => (Math.random() < 0.1 ? null : Math.floor(10 * Math.random())));
        arr1.unique();
        assert.ok(arr1.length == 11);

        var arrObj = Array(10).fill(0).map(v => ({}));
        var arr2 = Array(10000).fill(0).map((v, i) => (arrObj[Math.floor(10 * Math.random())]));
        arr2.unique();
        assert.ok(arr2.length == 10);
    });

    QUnit.test("delete", (assert) =>
    {
        var arr1 = Array(10).fill(0).map((v, i) => i);
        arr1.delete(arr1[Math.floor(10 * Math.random())]);
        assert.ok(arr1.length == 9);

        var arr2 = Array(10).fill(0).map(v => ({}));
        arr2.delete(arr2[Math.floor(10 * Math.random())]);
        assert.ok(arr2.length == 9);
    });

    QUnit.test("replace", (assert) =>
    {
        var arr1 = Array(10).fill(0).map((v, i) => i);
        arr1.replace(5, 50);
        assert.ok(arr1[5] == 50);

        arr1.replace(555, 999);
        assert.ok(arr1[arr1.length - 1] == 999);
    });
});