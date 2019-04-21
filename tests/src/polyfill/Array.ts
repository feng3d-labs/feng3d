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
});