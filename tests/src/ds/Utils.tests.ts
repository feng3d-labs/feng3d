QUnit.module("Utils", () =>
{
    QUnit.test("arrayFrom", (assert) =>
    {
        var arr = ds.utils.createArray(100, () => Math.floor(Math.random() * 100));
        var float32Array = new Float32Array(arr);

        var arr0 = ds.utils.arrayFrom(float32Array);
        assert.deepEqual(arr, arr0);
    });

    QUnit.test("arrayUnique", (assert) =>
    {
        var arr = ds.utils.createArray(100, () => Math.floor(Math.random() * 100));
        ds.utils.arrayUnique(arr);
        assert.deepEqual(ds.utils.arrayIsUnique(arr), true);
    });

    QUnit.test("arrayIsUnique", (assert) =>
    {
        assert.deepEqual(ds.utils.arrayIsUnique([1, 2, 3]), true);
        assert.deepEqual(ds.utils.arrayIsUnique([1, 2, 2]), false);
    });

    QUnit.test("createArray", (assert) =>
    {
        var arr = ds.utils.createArray(100, i => i);
        for (let i = 0; i < arr.length; i++)
        {
            assert.deepEqual(i, arr[i]);
        }
    });

    QUnit.test("binarySearch", (assert) =>
    {
        var arr = ds.utils.createArray(100, () => Math.floor(Math.random() * 100));
        var compareFn = (a, b) => a - b;
        arr.sort(compareFn);
        var index = Math.floor(arr.length * Math.random());
        var find = ds.utils.binarySearch(arr, arr[index], compareFn);
        assert.deepEqual(find <= index, true);

        assert.deepEqual(arr[index], arr[find]);
        if (find > 0)
            assert.equal(arr[find] - arr[find - 1] > 0, true);
        if (find < arr.length - 1)
            assert.equal(arr[find] - arr[find + 1] <= 0, true);

        assert.deepEqual(-1, ds.utils.binarySearch(arr, -1, compareFn));
    });

    QUnit.test("binarySearchInsert", (assert) =>
    {
        var arr = ds.utils.createArray(100, () => Math.floor(Math.random() * 100));
        var compareFn = (a, b) => a - b;
        arr.sort(compareFn);

        var index = Math.floor(arr.length * Math.random());
        var find = ds.utils.binarySearchInsert(arr, arr[index], compareFn);
        assert.deepEqual(find <= index, true);

        
        assert.deepEqual(0, ds.utils.binarySearchInsert(arr, -1, compareFn));

        assert.deepEqual(100, ds.utils.binarySearchInsert(arr, 10000, compareFn));
    });
});