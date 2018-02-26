QUnit.module("Array", () =>
{
    QUnit.test("unique", (assert) =>
    {
        var n = 100;
        var arr: number[] = [];
        while (n-- > 0)
        {
            arr.push(Math.floor(Math.random() * 10));
        }
        arr.unique();

        assert.ok(arr.unique());

        var arr0: { n: number }[] = [];
        while (n-- > 0)
        {
            arr0.push({ n: Math.floor(Math.random() * 10) });
        }
        arr0.unique((a, b) => { return a.n == b.n; });

        assert.ok(arr0.unique((a, b) => { return a.n == b.n; }));
    });
});