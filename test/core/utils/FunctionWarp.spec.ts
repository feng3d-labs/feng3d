import { functionwrap, __functionwrap__ } from '../../../src/core/utils/FunctionWarp';
import { task } from '../../../src/core/utils/Task';
import { Vector2 } from '../../../src/math/geom/Vector2';
import { mathUtil } from '../../../src/polyfill/MathUtil';

import { assert, describe, it } from 'vitest';
const { ok, equal, deepEqual } = assert;

describe('FunctionWrap', () =>
{
    it('extendFunction', () =>
    {
        class A
        {
            a = 'a';

            f(p = 'p', p1 = '')
            {
                return p + p1;
            }

            extendF: (p?: string, p1?: string) => string;
            oldf: (p?: string, p1?: string) => string;
        }

        const a = new A();
        a.oldf = a.f;
        a.extendF = function (_p = 'p', _p1 = '')
        {
            return ['polyfill', this.a, this.oldf()].join('-');
        };
        functionwrap.extendFunction(a, 'f', function (r)
        {
            return ['polyfill', this.a, r].join('-');
        });
        // 验证 被扩展的a.f方法是否等价于 a.extendF
        ok(a.f() === a.extendF()); // true
    });

    it('wrap & unwrap ', () =>
    {
        const o = {
            v: 1, f(a: number)
            {
                this.v = this.v + a;
            }
        };

        function wrapFunc(_a: number)
        {
            this.v = 0;
        }

        // 添加函数在指定函数之前执行
        functionwrap.wrap(o, 'f', wrapFunc);
        let v = Math.random();
        o.f(v);
        ok(o.v === v);

        // 添加函数在指定函数之后执行
        functionwrap.wrap(o, 'f', null, wrapFunc);
        v = Math.random();
        o.f(v);
        ok(o.v === 0);

        ok(o[__functionwrap__]);

        functionwrap.unwrap(o, 'f', wrapFunc);
        ok(!o[__functionwrap__]);

        o.v = 0;
        v = Math.random();
        o.f(v);
        ok(o.v === v);

        const vec2 = new Vector2();

        const propertyDescriptor = Object.getOwnPropertyDescriptor(vec2, 'sub');

        functionwrap.wrap(vec2, 'sub', (v) =>
        {
            v.set(0, 0);

            return null;
        });
        ok(vec2[__functionwrap__]);

        functionwrap.unwrap(vec2, 'sub');
        ok(!vec2[__functionwrap__]);

        const propertyDescriptor1 = Object.getOwnPropertyDescriptor(vec2, 'sub');
        deepEqual(propertyDescriptor, propertyDescriptor1);
    });

    it('wrapAsyncFunc', (done) =>
    {
        // 执行次数
        let executions = 0;

        // 异步函数
        function af(a: number, callback: (r: number) => void = (() => { }))
        {
            setTimeout(() =>
            {
                executions++;
                callback(a * a);
            }, mathUtil.randInt(10, 50));
        }

        // 包装后的函数
        function wrapFunc(_a: number, callback: (r: number) => void)
        {
            functionwrap.wrapAsyncFunc(null, af, [1], callback);
        }

        // 测试同时调用五次 af 函数
        function testAfs(callback: () => void)
        {
            executions = 0;
            let callbackTime = 0;
            const fns = new Array(5).fill(5).map((v) => (callback) => af(v, () =>
            {
                callbackTime++;
                callback();
            }));



            // 同时调用五次函数并等待完成
            task.parallel(fns)(() =>
            {
                // af 函数 执行5次
                equal(executions, 5);
                // 回调执行5次
                equal(callbackTime, 5);
                callback();
            });
        }

        // 测试同时五次调用 wrapFunc 函数
        function testWrapFuncs(callback: () => void)
        {
            executions = 0;
            let callbackTime = 0;
            const fns = new Array(5).fill(5).map((v) => (callback) => wrapFunc(v, () =>
            {
                callbackTime++;
                callback();
            }));
            // 同时调用五次函数并等待完成
            task.parallel(fns)(() =>
            {
                // af 函数 执行1次
                equal(executions, 1);
                // 回调执行5次
                equal(callbackTime, 5);
                callback();
            });
        }

        // 串联（依次）执行两个测试函数
        task.series([testAfs, testWrapFuncs])(() =>
        {
            ok(true);
        });
    });
});
