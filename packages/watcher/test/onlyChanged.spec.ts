import { watcher } from '../src/watcher';

import { assert, describe, it } from 'vitest';

describe('watch', () =>
{
    it('多次监听同一属性，回调中移除监听 watch', () =>
    {
        const obj = { a: Math.random() };
        let callCount = 0;
        const handler = () =>
        {
            callCount++;
            watcher.unwatch(obj, 'a', handler);
        };
        const handler1 = () =>
        {
            callCount++;
            watcher.unwatch(obj, 'a', handler1);
        };
        watcher.watch(obj, 'a', handler);
        watcher.watch(obj, 'a', handler1);
        obj.a++; // 触发两个不同回调
        assert.equal(callCount, 2);
    });

    it('onlyChanged watch', () =>
    {
        {
            const obj = { a: { b: Math.random() }, d: Math.random() };
            let result = false;
            watcher.watch(obj, 'd', () => { result = true; });
            obj.d = obj.d;
            assert.equal(result, false);
        }

        {
            const obj = { a: { b: Math.random() }, d: Math.random() };
            const onlyChanged = true;
            let result = false;
            watcher.watch(obj, 'd', () => { result = true; }, undefined, onlyChanged);
            obj.d = obj.d;
            assert.equal(result, false);
        }

        {
            const obj = { a: { b: Math.random() }, d: Math.random() };
            const onlyChanged = false;
            let result = false;
            watcher.watch(obj, 'd', () => { result = true; }, undefined, onlyChanged);
            obj.d = obj.d;
            assert.equal(result, true);
        }
    });

    it('onlyChanged watchchain', () =>
    {
        {
            const obj = { a: { b: Math.random() }, d: Math.random() };
            let result = false;
            watcher.watchchain(obj, 'a.b', () => { result = true; });
            obj.a.b = obj.a.b;
            assert.equal(result, false);
        }

        {
            const obj = { a: { b: Math.random() }, d: Math.random() };
            const onlyChanged = true;
            let result = false;
            watcher.watchchain(obj, 'a.b', () => { result = true; }, undefined, onlyChanged);
            obj.a.b = obj.a.b;
            assert.equal(result, false);
        }

        {
            const obj = { a: { b: Math.random() }, d: Math.random() };
            const onlyChanged = false;
            let result = false;
            const handler = () => { result = true; };
            watcher.watchchain(obj, 'a.b', handler, undefined, onlyChanged);
            obj.a.b = obj.a.b;
            assert.equal(result, true);

            //
            result = false;
            obj.a = { b: obj.a.b };
            assert.equal(result, true);

            //
            result = false;
            obj.a.b = obj.a.b;
            assert.equal(result, true);

            watcher.unwatchchain(obj, 'a.b', handler, undefined);
            result = false;
            obj.a = { b: obj.a.b };
            assert.equal(result, false);
        }
    });

    it('onlyChanged watchobject', () =>
    {
        {
            const obj = { a: { b: Math.random() }, d: Math.random() };
            let result = false;
            watcher.watchobject(obj, { a: { b: undefined } }, () => { result = true; });
            obj.a.b = obj.a.b;
            assert.equal(result, false);
        }

        {
            const obj = { a: { b: Math.random() }, d: Math.random() };
            const onlyChanged = true;
            let result = false;
            watcher.watchobject(obj, { a: { b: undefined } }, () => { result = true; }, undefined, onlyChanged);
            obj.a.b = obj.a.b;
            assert.equal(result, false);
        }

        {
            const obj = { a: { b: Math.random() }, d: Math.random() };
            const onlyChanged = false;
            let result = false;
            watcher.watchobject(obj, { a: { b: undefined } }, () => { result = true; }, undefined, onlyChanged);
            obj.a.b = obj.a.b;
            assert.equal(result, true);
        }
    });
});
