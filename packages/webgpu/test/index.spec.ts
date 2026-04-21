import { batchRun, effect, reactive } from '@feng3d/reactivity';
import { assert, describe, it } from 'vitest';

describe('test', () =>
{
    it('constructor', () =>
    {
        const reactiveObj = reactive({ a: 0, b: 0 });

        let callCount = 0;

        effect(() =>
        {
            reactiveObj.a;
            reactiveObj.b;
            callCount++;
        })

        assert.strictEqual(callCount, 1);

        reactiveObj.a++;
        reactiveObj.b++;

        assert.strictEqual(callCount, 3);

        batchRun(() =>
        {
            reactiveObj.a++;
            reactiveObj.b++;
        });

        assert.strictEqual(callCount, 4);
    });
});
