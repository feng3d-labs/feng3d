import { assert, describe, it } from 'vitest';
import { task } from './Task';

describe('task', () =>
{
    it('series', () =>
    {
        const result: number[] = [];
        const arr = [1, 2, 3, 4, 5];
        const funcs = arr.map((v) => (callback: () => void) =>
        {
            result.push(v);

            setTimeout(() =>
            {
                callback();
            }, 1000);
        });

        task.series(funcs)(() =>
        {
            assert.ok(JSON.stringify(arr) === JSON.stringify(result));
        });
        assert.ok(true);
    });
});
