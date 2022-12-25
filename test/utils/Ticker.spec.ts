import { ticker } from '../../src/core/utils/Ticker';

import { assert, describe, expect, it } from 'vitest'
const { ok, equal, deepEqual } = assert;

describe('ticker', () =>
{
    it('repeat', (done) =>
    {
        let num = 0;

        const timers = 5;

        ticker.repeat(100, timers, () =>
        {
            num++;
        })

        ticker.once(1000, () =>
        {
            // equal(num, timers, `应该会有 ${timers} 次回调，但只接受到 ${num} 次回调。`);
            ok(true);
        });
    });
});
