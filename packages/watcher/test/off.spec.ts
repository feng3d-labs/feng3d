import { watcher } from '../src/watcher';

import { assert, describe, it } from 'vitest';

describe('WatchSession', () =>
{
    it('watcher.on WatchSession.off', () =>
    {
        const watchSession = watcher.on();
        //
        const o = { a: 1 };
        let out = '';
        const f = (_h, _p, _o) => { out += 'f'; };
        const f1 = (_h, _p, _o) => { out += 'f1'; };
        watchSession.watch(o, 'a', f);
        watchSession.watch(o, 'a', f1);
        out = '';
        o.a = 2;
        assert.equal(out, 'ff1');
        watchSession.off();
        out = '';
        o.a = 3;
        assert.equal(out, '');

        //
        watchSession.watch(o, 'a', f);
        watchSession.watch(o, 'a', f1);
        out = '';
        o.a = 2;
        assert.equal(out, 'ff1');
        watchSession.off();
        out = '';
        o.a = 3;
        assert.equal(out, '');
    });
});
