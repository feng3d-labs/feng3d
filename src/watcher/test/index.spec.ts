import { watcher } from '../src/watcher';

import { assert, describe, it } from 'vitest';
const { ok, equal, deepEqual } = assert;

describe('watcher', () =>
{
    it('watch Object', () =>
    {
        const o = { a: 1 };
        let out = '';
        const f = (_h, _p, _o) => { out += 'f'; };
        const f1 = (_h, _p, _o) => { out += 'f1'; };
        watcher.watch(o, 'a', f);
        watcher.watch(o, 'a', f1);
        o.a = 2;
        watcher.unwatch(o, 'a', f);
        o.a = 3;
        equal(out === 'ff1f1', true);
    });

    it('bind', () =>
    {
        const o1 = { a: 1 };
        const o2 = { a: 1 };

        watcher.bind(o1, 'a', o2, 'a');

        o1.a = 2;
        equal(o1.a === o2.a && o2.a === 2, true);

        o2.a = 5;
        equal(o1.a === o2.a && o1.a === 5, true);
    });

    it('watch custom A', () =>
    {
        class A
        {
            get a()
            {
                return this._a;
            }
            set a(v)
            {
                this._a = v;
                num = v;
            }
            private _a = 1;
        }
        const o = new A();
        let num = 0;
        let out = '';
        const f = (_h, _p, _o) => { out += 'f'; };
        const f1 = (_h, _p, _o) => { out += 'f1'; };
        watcher.watch(o, 'a', f);
        watcher.watch(o, 'a', f1);
        o.a = 2;
        equal(num, 2);
        watcher.unwatch(o, 'a', f);
        o.a = 3;
        equal(out === 'ff1f1', true);
        equal((num as any), 3);
    });

    it('watchchain Object', () =>
    {
        const o = { a: { b: { c: 1 } } };
        let out = '';
        const f = (_h: any, _p: any, _o: any) => { out += 'f'; };
        const f1 = (_h, _p, _o) => { out += 'f1'; };
        watcher.watchchain(o, 'a.b.c', f);
        watcher.watchchain(o, 'a.b.c', f1);
        o.a.b.c = 2;
        watcher.unwatchchain(o, 'a.b.c', f);
        o.a.b.c = 3;
        equal(out === 'ff1f1', true);
        //
        out = '';
        watcher.unwatchchain(o, 'a.b.c', f1);
        o.a.b.c = 4;
        equal(out, '');
        //
        out = '';
        watcher.watchchain(o, 'a.b.c', f);
        o.a.b.c = 4;
        o.a.b.c = 5;
        equal(out, 'f');
        //
        out = '';
        o.a = { b: { c: 1 } };
        o.a.b.c = 3;
        equal(out, 'ff', `out:${out}`);
        //
        out = '';
        watcher.unwatchchain(o, 'a.b.c', f);
        o.a.b.c = 4;
        equal(out, '', `out:${out}`);
        //
        out = '';
        watcher.watchchain(o, 'a.b.c', f);
        o.a = <any>null;
        o.a = { b: { c: 1 } };
        o.a.b.c = 5;
        equal(out, 'fff', out);
    });

    it('bind unbind', () =>
    {
        const vec2 = { x: 0, y: 0 };// new Vector2();
        const vec3 = { x: 0, y: 0, z: 0 };// new Vector3();
        const vec4 = { x: 0, y: 0, z: 0, w: 0 };// new Vector4();

        watcher.bind(vec2, 'x', vec3, 'x');
        watcher.bind(vec2, 'x', vec4, 'x');

        let v = Math.random();

        vec2.x = v;
        equal(vec2.x, v);
        equal(vec2.x, vec3.x);
        equal(vec2.x, vec4.x);

        vec4.x = v = Math.random();
        equal(vec2.x, v);
        equal(vec2.x, vec3.x);
        equal(vec2.x, vec4.x);

        watcher.unbind(vec3, 'x', vec2, 'x');
        watcher.unbind(vec2, 'x', vec4, 'x');

        vec4.x = v = Math.random();
        equal(vec4.x, v);
        equal(vec2.x, vec3.x);

        assert.ok(vec2.x !== v);
    });

    it('watchobject', () =>
    {
        const o = { a: { b: { c: 1 }, d: 2 } };
        let out = '';
        const f = (_h, _p, _o) => { out += 'f'; };

        watcher.watchobject(o, { a: { b: { c: 0 }, d: 0 } }, f);

        out = '';
        o.a.b.c = 10; // 调用一次函数f
        o.a.d = 10;// 调用一次函数f
        equal(out, 'ff');

        watcher.unwatchobject(o, { a: { b: { c: 0 }, d: 0 } }, f);

        out = '';
        o.a.b.c = 10; // 调用一次函数f
        o.a.d = 10;// 调用一次函数f
        equal(out, '');

        // 监听所有属性
        out = '';
        watcher.watchobject(o, o, f);
        o.a.d = 100;
        o.a.b.c = 100;
        equal(out, 'ff');

        watcher.unwatchobject(o, o, f);
    });
});
