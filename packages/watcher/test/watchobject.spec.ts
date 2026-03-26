import { watcher } from '../src/watcher';

import { assert, describe, it } from 'vitest';

describe('watcher.watchobject transform', () =>
{
    it('测试监听很深的子对象被赋值为null是否正常', () =>
    {
        const a = { a1: { a2: { a3: { a4: { a5: { a6: { a7: { a8: { a9: { a10: { a11: { a12: { a13: { a14: { a15: { a16: { a17: { a18: { a19: { a20: { a21: { a22: { a23: { a24: { a25: { a26: 1 } } } } } } } } } } } } } } } } } } } } } } } } } };

        const result: {}[] = [];

        const handler = (newValue: any, oldValue: any, host: any, property: string) =>
        {
            assert.deepEqual(host, a);
            result.push(`transform changed: ${property} = ${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}`);
        };

        watcher.watchobject(a, a, handler);

        const a2 = a.a1.a2;

        result.length = 0;
        a.a1.a2 = null as any;

        assert.deepEqual(result, [
            'transform changed: a1.a2.a3.a4.a5.a6.a7.a8.a9.a10.a11.a12.a13.a14.a15.a16.a17.a18.a19.a20.a21.a22.a23.a24.a25.a26 = 1 -> undefined',
        ]);

        result.length = 0;
        a.a1.a2 = a2;

        assert.deepEqual(result, [
            'transform changed: a1.a2.a3.a4.a5.a6.a7.a8.a9.a10.a11.a12.a13.a14.a15.a16.a17.a18.a19.a20.a21.a22.a23.a24.a25.a26 = undefined -> 1',
        ]);
    });

    it('测试监听子对象被赋值为null是否正常', () =>
    {
        const result: {}[] = [];

        const handler = (newValue: any, oldValue: any, host: any, property: string) =>
        {
            result.push(`transform changed: ${property} = ${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}`);
        };

        const material = {
            shadername: 'shader',
            defines: {
                FOO: 1,
                BAR: 2,
            },
        };

        watcher.watchobject(material, {
            shadername: 'shader',
            defines: {
                FOO: 1,
                BAR: 2,
            },
        }, handler);

        const handler1 = (newValue: any, oldValue: any, host: any, property: string) =>
        {
            result.push(`transform changed: ${property} = ${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}`);
        };
        watcher.watchobject(material, {
            shadername: 'shader',
            defines: {
                FOO: 1,
                BAR: 2,
            },
        }, handler1);

        result.length = 0;
        material.defines = null as any;
        assert.deepEqual(result, [
            `transform changed: defines.FOO = 1 -> undefined`,
            `transform changed: defines.BAR = 2 -> undefined`,
            `transform changed: defines.FOO = 1 -> undefined`,
            `transform changed: defines.BAR = 2 -> undefined`,
        ]);

        result.length = 0;
        material.defines = {
            FOO: 1,
            BAR: 2,
        };

        assert.deepEqual(result, [
            'transform changed: defines.FOO = undefined -> 1',
            'transform changed: defines.BAR = undefined -> 2',
            'transform changed: defines.FOO = undefined -> 1',
            'transform changed: defines.BAR = undefined -> 2',
        ]);

        watcher.unwatchobject(material, {
            shadername: 'shader',
            defines: {
                FOO: 1,
                BAR: 2,
            },
        }, handler);

        result.length = 0;
        material.defines = null as any;
        assert.deepEqual(result, [
            'transform changed: defines.FOO = 1 -> undefined',
            'transform changed: defines.BAR = 2 -> undefined',
        ]);

        result.length = 0;
        material.defines = {
            FOO: 1,
            BAR: 2,
        };
        assert.deepEqual(result, [
            'transform changed: defines.FOO = undefined -> 1',
            'transform changed: defines.BAR = undefined -> 2',
        ]);
    });

    it('使用`watcher.watchobject`监听transform', () =>
    {
        // 变换
        const transform = {
            position: { x: 0, y: 0, z: 0 },
            angle: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
        };

        let changeCount = 0;

        // 变化回调
        function onChanged(_newValue: any, _oldValue: any, _host: any, _property: string)
        {
            changeCount++;
        }

        // 监听变化
        watcher.watchobject(transform, { position: { x: 0, y: 0, z: 0 }, angle: { x: 0, y: 0, z: 0 }, scale: { x: 0, y: 0, z: 0 } }, onChanged);
        //
        changeCount = 0;
        transform.position.x = Math.random();
        assert.equal(changeCount, 1); // 触发改变一次

        changeCount = 0;
        transform.position.x = transform.position.x + 0;
        assert.equal(changeCount, 0); // 赋予相同的值不会触发改变

        changeCount = 0;
        transform.position = { x: Math.random(), y: Math.random(), z: Math.random() };
        assert.equal(changeCount, 3); // x、y、z均改变

        changeCount = 0;
        transform.position = { x: transform.position.x, y: transform.position.y, z: transform.position.z };
        assert.equal(changeCount, 0); // x、y、z均未改变

        // 移除监听变化
        watcher.unwatchobject(transform, { position: { x: 0, y: 0, z: 0 }, angle: { x: 0, y: 0, z: 0 }, scale: { x: 0, y: 0, z: 0 } }, onChanged);

        changeCount = 0;
        transform.position = { x: Math.random(), y: Math.random(), z: Math.random() };
        assert.equal(changeCount, 0); // 无法监听到x、y、z改变
    });
});
