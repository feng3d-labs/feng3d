import { assert, describe, it } from 'vitest';
const { ok, equal, deepEqual, strictEqual } = assert;

import { ChainMap } from '../../src/utils/ChainMap';
import { ChainMap3 } from './ChainMap3';
import { ChainObjectMap } from './ChainObjectMap';

describe('ChainMap', () =>
{
    it('ChainMap', () =>
    {
        const o = {};

        const map = new ChainMap<[number, boolean, string, {}], number>();

        map.set([0, true, 'a', o], 1);

        let result = map.get([0, true, 'a', o]);

        equal(1, result);

        map.delete([0, true, 'a', o]);
        result = map.get([0, true, 'a', o]);
        equal(undefined, result);
    });

    it('性能测试', () =>
    {
        const Num = 100000;
        const data = new Array(Num).fill(0).map((v, i) => ({ key0: Math.random(), key1: Math.random() < 0.5, key2: 'abc'[Math.floor(Math.random() * 3)], result: i }));

        {
            const chainMap = new ChainMap<[number, boolean, string], number>();

            console.time(`ChainMap set`);
            data.forEach((v) =>
            {
                chainMap.set([v.key0, v.key1, v.key2], v.result);
            });
            console.timeEnd(`ChainMap set`);

            console.time(`ChainMap get`);
            data.forEach((v) =>
            {
                const result = chainMap.get([v.key0, v.key1, v.key2]);

                equal(v.result, result);
            });
            console.timeEnd(`ChainMap get`);

            const chainObjectMap = new ChainObjectMap<[number, boolean, string], number>();

            console.time(`ChainObjectMap set`);
            data.forEach((v) =>
            {
                chainObjectMap.set([v.key0, v.key1, v.key2], v.result);
            });
            console.timeEnd(`ChainObjectMap set`);

            console.time(`ChainObjectMap get`);
            data.forEach((v) =>
            {
                const result = chainObjectMap.get([v.key0, v.key1, v.key2]);

                equal(v.result, result);
            });
            console.timeEnd(`ChainObjectMap get`);

            const chainMap3 = new ChainMap3<number, boolean, string, number>();

            console.time(`ChainMap3 set`);
            data.forEach((v) =>
            {
                chainMap3.set([v.key0, v.key1, v.key2], v.result);
            });
            console.timeEnd(`ChainMap3 set`);

            console.time(`ChainMap3 get`);
            data.forEach((v) =>
            {
                const result = chainMap3.get([v.key0, v.key1, v.key2]);

                equal(v.result, result);
            });
            console.timeEnd(`ChainMap3 get`);
        }

        {
            const chainMap = new ChainMap<[number, boolean, string], number>();

            console.time(`ChainMap set`);
            data.forEach((v) =>
            {
                chainMap.set([v.key0, v.key1, v.key2], v.result);
            });
            console.timeEnd(`ChainMap set`);

            console.time(`ChainMap get`);
            data.forEach((v) =>
            {
                const result = chainMap.get([v.key0, v.key1, v.key2]);

                equal(v.result, result);
            });
            console.timeEnd(`ChainMap get`);

            const chainObjectMap = new ChainObjectMap<[number, boolean, string], number>();

            console.time(`ChainObjectMap set`);
            data.forEach((v) =>
            {
                chainObjectMap.set([v.key0, v.key1, v.key2], v.result);
            });
            console.timeEnd(`ChainObjectMap set`);

            console.time(`ChainObjectMap get`);
            data.forEach((v) =>
            {
                const result = chainObjectMap.get([v.key0, v.key1, v.key2]);

                equal(v.result, result);
            });
            console.timeEnd(`ChainObjectMap get`);

            const chainMap3 = new ChainMap3<number, boolean, string, number>();

            console.time(`ChainMap3 set`);
            data.forEach((v) =>
            {
                chainMap3.set([v.key0, v.key1, v.key2], v.result);
            });
            console.timeEnd(`ChainMap3 set`);

            console.time(`ChainMap3 get`);
            data.forEach((v) =>
            {
                const result = chainMap3.get([v.key0, v.key1, v.key2]);

                equal(v.result, result);
            });
            console.timeEnd(`ChainMap3 get`);
        }

        // 结果，ChainObjectMap不如ChainMap效率高。ChainMap 与 ChainMap3 性能差不多。直接使用通用的ChainMap就很好了。
        // ChainMap set: 84.144ms
        // ChainMap get: 94.894ms
        // ChainObjectMap set: 149.668ms
        // ChainObjectMap get: 163.372ms
        // ChainMap3 set: 50.336ms
        // ChainMap3 get: 96.217ms
        // ChainMap set: 54.614ms
        // ChainMap get: 98.033ms
        // ChainObjectMap set: 101.39ms
        // ChainObjectMap get: 169.301ms
        // ChainMap3 set: 49.931ms
        // ChainMap3 get: 94.277ms

        equal(1, 1);
    });
});
