const result: number[] = [];
const arr = [1, 2, 3, 4, 5];
const funcs = arr.map((v) =>
    (callback: () => void) =>
    {
        result.push(v); setTimeout(() =>
        {
            callback();
        }, 1000);
    });

feng3d.task.series(funcs)(() =>
{
    console.assert(JSON.stringify(arr) === JSON.stringify(result));
});
console.assert(true);
