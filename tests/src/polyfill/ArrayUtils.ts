QUnit.module("Array", () =>
{
    const ArrayUtils = feng3d.ArrayUtils;
    
    QUnit.test("equal", (assert) =>
    {
        assert.ok(ArrayUtils.equal([1, 2, 3], [1, 2, 3]));

        assert.ok(!ArrayUtils.equal([{}, 2, 3], [{}, 2, 3]));

        var obj = {};
        assert.ok(ArrayUtils.equal([obj, 2, 3], [obj, 2, 3]));
    });

    QUnit.test("isUnique", (assert) =>
    {
        assert.deepEqual(ArrayUtils.isUnique([1, 2, 3]), true);
        assert.deepEqual(ArrayUtils.isUnique([1, 2, 2]), false);
    });

    QUnit.test("concatToSelf", (assert) =>
    {
        var arr = [0];
        ArrayUtils.concatToSelf(arr, 1, 2, 3, [4, 5, 6], 7, 8, 9);

        var arr1 = Array(10).fill(0).map((v, i) => i);

        assert.ok(ArrayUtils.equal(arr, arr1));
    });

    QUnit.test("unique", (assert) =>
    {
        var arr1 = Array(10000).fill(0).map((v, i) => (Math.random() < 0.1 ? null : Math.floor(10 * Math.random())));
        ArrayUtils.unique(arr1);
        assert.ok(arr1.length == 11);

        var arrObj = Array(10).fill(0).map(v => ({}));
        var arr2 = Array(10000).fill(0).map((v, i) => (arrObj[Math.floor(10 * Math.random())]));
        ArrayUtils.unique(arr2);
        assert.ok(arr2.length == 10);
    });

    QUnit.test("delete", (assert) =>
    {
        var arr1 = Array(10).fill(0).map((v, i) => i);
        ArrayUtils.deleteItem(arr1, arr1[Math.floor(10 * Math.random())]);
        assert.ok(arr1.length == 9);

        var arr2 = Array(10).fill(0).map(v => ({}));
        ArrayUtils.deleteItem(arr2, arr2[Math.floor(10 * Math.random())]);
        assert.ok(arr2.length == 9);
    });

    QUnit.test("replace", (assert) =>
    {
        var arr1 = Array(10).fill(0).map((v, i) => i);
        ArrayUtils.replace(arr1, 5, 50);
        assert.ok(arr1[5] == 50);

        ArrayUtils.replace(arr1, 555, 999);
        assert.ok(arr1[arr1.length - 1] == 999);
    });

    QUnit.test("create", (assert) =>
    {
        var arr = ArrayUtils.create(100, i => i);
        for (let i = 0; i < arr.length; i++)
        {
            assert.deepEqual(i, arr[i]);
        }
    });

    QUnit.test("binarySearch", (assert) =>
    {
        var arr = ArrayUtils.create(100, () => Math.floor(Math.random() * 100));
        var compareFn = (a, b) => a - b;
        arr.sort(compareFn);
        var index = Math.floor(arr.length * Math.random());
        var find = ArrayUtils.binarySearch(arr, arr[index], compareFn);
        assert.deepEqual(find <= index, true);

        assert.deepEqual(arr[index], arr[find]);
        if (find > 0)
            assert.equal(arr[find] - arr[find - 1] > 0, true);
        if (find < arr.length - 1)
            assert.equal(arr[find] - arr[find + 1] <= 0, true);

        assert.deepEqual(-1, ArrayUtils.binarySearch(arr, -1, compareFn));
    });

    QUnit.test("binarySearchInsert", (assert) =>
    {
        var arr = ArrayUtils.create(100, () => Math.floor(Math.random() * 100));
        var compareFn = (a, b) => a - b;
        arr.sort(compareFn);

        var index = Math.floor(arr.length * Math.random());
        var find = ArrayUtils.binarySearchInsert(arr, arr[index], compareFn);
        assert.deepEqual(find <= index, true);


        assert.deepEqual(0, ArrayUtils.binarySearchInsert(arr, -1, compareFn));

        assert.deepEqual(100, ArrayUtils.binarySearchInsert(arr, 10000, compareFn));
    });
});