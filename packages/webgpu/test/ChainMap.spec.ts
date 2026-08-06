import { assert, describe, it } from 'vitest';
import { ChainMap } from '../src/utils/ChainMap';

describe('ChainMap', () =>
{
    it('性能测试', () =>
    {
        // 使用 ChainMap 与 ObjectMap 性能差不多，ChainMap 更加灵活。
        const map = new ChainMap<[number, boolean, string], number>();
        const map1: { [key: string]: number } = {};

        const testdata: [[number, boolean, string], number][] = new Array(10000).fill(0).map((v, i) => ([[Math.random(), Math.random() < 0.5, 'abc'[Math.floor(Math.random() * 3)]], i]));

        console.time('ChainMap set');
        testdata.forEach((v) =>
        {
            map.set(v[0], v[1]);
        });
        console.timeEnd('ChainMap set');

        console.time('ChainMap get');
        testdata.forEach((v) =>
        {
            const result = map.get(v[0]);

            assert.strictEqual(v[1], result);
        });
        console.timeEnd('ChainMap get');

        console.time('ChainObjectMap set');
        testdata.forEach((v) =>
        {
            map1[`${v[0][0]},${v[0][1]},${v[0][2]},${v[1]}`] = v[1];
        });
        console.timeEnd('ChainObjectMap set');

        console.time('ChainObjectMap get');
        testdata.forEach((v) =>
        {
            const result = map1[`${v[0][0]},${v[0][1]},${v[0][2]},${v[1]}`];

            assert.strictEqual(v[1], result);
        });
        console.timeEnd('ChainObjectMap get');

    });
});
