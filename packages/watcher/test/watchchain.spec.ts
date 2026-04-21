import { watcher } from '../src/watcher';

import { assert, describe, it } from 'vitest';

const __watchs__ = '__watchs__';
const __watchchains__ = '__watchchains__';

describe('watchchain', () => {
    it('watchchain', () => {
        const obj: {
            __watchs__?: any;
            __watchchains__?: any;
            a: {
                __watchs__?: any;
                __watchchains__?: any;
                b: number;
            };
        } = { a: { b: 1 } };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 用于测试
        let result = false;
        const handler = () => { result = true; };
        watcher.watchchain(obj, 'a.b', handler);

        assert.equal(!!obj.a[__watchs__], true);
        assert.equal(!!obj[__watchs__], true);
        assert.equal(!!obj[__watchchains__], true);

        watcher.unwatchchain(obj, 'a.b', handler);
        assert.equal(!!obj.a[__watchs__], false);
        assert.equal(!!obj[__watchs__], false);
        assert.equal(!!obj[__watchchains__], false);
    });

    it('watchchain 相同子对象', () => {
        const obj: {
            __watchs__?: any;
            __watchchains__?: any;
            a: {
                __watchs__?: any;
                __watchchains__?: any;
                b: number;
            };
        } = { a: { b: 1 } };
        const obj1: {
            __watchs__?: any;
            __watchchains__?: any;
            a: {
                __watchs__?: any;
                __watchchains__?: any;
                b: number;
            };
        } = { a: obj.a };
        // eslint-disable-next-line no-useless-assignment -- 变量在后续代码中使用
        let result = false;
        // eslint-disable-next-line no-useless-assignment -- 变量在后续代码中使用
        let result1 = false;
        const handler = () => { result = true; };
        watcher.watchchain(obj, 'a.b', handler);
        assert.equal(!!obj.a[__watchs__], true);
        assert.equal(!!obj[__watchs__], true);
        assert.equal(!!obj[__watchchains__], true);

        const handler1 = () => { result1 = true; };
        watcher.watchchain(obj1, 'a.b', handler1);
        assert.equal(!!obj1.a[__watchs__], true);
        assert.equal(!!obj1[__watchs__], true);
        assert.equal(!!obj1[__watchchains__], true);

        result = false;
        result1 = false;
        obj.a.b = obj.a.b + 1;
        assert.equal(result, true);
        assert.equal(result1, true);

        result = false;
        result1 = false;
        obj1.a.b = obj1.a.b + 1;
        assert.equal(result, true);
        assert.equal(result1, true);

        watcher.unwatchchain(obj, 'a.b', handler);
        assert.equal(!!obj.a[__watchs__], true); // 由于obj与obj1公用a
        assert.equal(!!obj[__watchs__], false);
        assert.equal(!!obj[__watchchains__], false);

        assert.equal(!!obj1.a[__watchs__], true);
        assert.equal(!!obj1[__watchs__], true);
        assert.equal(!!obj1[__watchchains__], true);

        result = false;
        result1 = false;
        obj.a.b = obj.a.b + 1;
        assert.equal(result, false);
        assert.equal(result1, true);

        watcher.unwatchchain(obj1, 'a.b', handler1);

        assert.equal(!!obj.a[__watchs__], false); // 由于obj与obj1公用a
        assert.equal(!!obj[__watchs__], false);
        assert.equal(!!obj[__watchchains__], false);

        assert.equal(!!obj1.a[__watchs__], false);
        assert.equal(!!obj1[__watchs__], false);
        assert.equal(!!obj1[__watchchains__], false);
    });

    it('watchchain 相同子对象1', () => {
        const obj: {
            __watchs__?: any;
            __watchchains__?: any;
            a: {
                __watchs__?: any;
                __watchchains__?: any;
                b: number;
            };
        } = { a: { b: 1 } };
        const obj1: {
            __watchs__?: any;
            __watchchains__?: any;
            a: {
                __watchs__?: any;
                __watchchains__?: any;
                b: number;
            };
        } = { a: obj.a };
        // eslint-disable-next-line no-useless-assignment -- 变量在后续代码中使用
        let result = false;
        // eslint-disable-next-line no-useless-assignment -- 变量在后续代码中使用
        let result1 = false;
        const handler = () => { result = true; };
        watcher.watchchain(obj, 'a.b', handler);

        const handler1 = () => { result1 = true; };
        watcher.watchchain(obj1, 'a.b', handler1);

        result = false;
        result1 = false;
        obj1.a = { b: obj.a.b + 1 }; // obj与obj1不再公用a
        assert.equal(result, false);
        assert.equal(result1, true);

        result = false;
        result1 = false;
        obj1.a.b = obj1.a.b + 1;
        assert.equal(result, false);
        assert.equal(result1, true);

        watcher.unwatchchain(obj, 'a.b', handler);
        assert.equal(!!obj.a[__watchs__], false);
        assert.equal(!!obj[__watchs__], false);
        assert.equal(!!obj[__watchchains__], false);

        assert.equal(!!obj1.a[__watchs__], true);
        assert.equal(!!obj1[__watchs__], true);
        assert.equal(!!obj1[__watchchains__], true);

        result = false;
        result1 = false;
        obj.a.b = obj.a.b + 1;
        assert.equal(result, false);
        assert.equal(result1, false);

        watcher.unwatchchain(obj1, 'a.b', handler1);

        assert.equal(!!obj.a[__watchs__], false);
        assert.equal(!!obj[__watchs__], false);
        assert.equal(!!obj[__watchchains__], false);

        assert.equal(!!obj1.a[__watchs__], false);
        assert.equal(!!obj1[__watchs__], false);
        assert.equal(!!obj1[__watchchains__], false);
    });
});
