QUnit.module("Task", () =>
{
    QUnit.test("series", (assert) =>
    {
        var result: number[] = [];
        var arr = [1, 2, 3, 4, 5];
        var funcs = arr.map(v =>
        {
            return (callback: () => void) =>
            {
                result.push(v); setTimeout(() =>
                {
                    callback();
                }, 1000);
            };
        });
        feng3d.task.series(funcs)(() =>
        {
            console.assert(JSON.stringify(arr) == JSON.stringify(result));
        });
        assert.ok(true);
    });
});