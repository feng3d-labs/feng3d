import { watcher } from '../src/watcher';

import { assert, describe, it } from 'vitest';

describe('Watcher.watch', () =>
{
    it('不能重复监听', () =>
    {
        //
        const o = { a: 1 };
        let out = '';
        const f = (_h, _p, _o) => { out += 'f'; };

        //
        let warn: any;
        const oldWarn = console.warn;
        console.warn = (...args: any) => { warn = args; };

        watcher.watch(o, 'a', f);
        watcher.watch(o, 'a', f);

        console.warn = oldWarn;

        assert.equal(!!warn, true); // 有警告
    });
});
