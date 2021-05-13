const result = [];
const arr = [1, 2, 3, 4, 5];
const funcs = arr.map(function (v)
{
    return function (callback)
    {
        result.push(v);
        setTimeout(function ()
        {
            callback();
        }, 1000);
    };
});

feng3d.task.series(funcs)(function ()
{
    console.assert(JSON.stringify(arr) == JSON.stringify(result));
});
console.assert(true);
// # sourceMappingURL=task-tests.js.map
