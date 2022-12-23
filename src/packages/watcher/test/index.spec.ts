import { equal, ok } from 'assert';
import { watcher, __watchchains__ } from '../src';

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
        ok(out === 'ff1f1', out);
    });

    it('bind', () =>
    {
        const o1 = { a: 1 };
        const o2 = { a: 1 };

        watcher.bind(o1, 'a', o2, 'a');

        o1.a = 2;
        ok(o1.a === o2.a && o2.a === 2);

        o2.a = 5;
        ok(o1.a === o2.a && o1.a === 5);
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
        ok(num === 2);
        watcher.unwatch(o, 'a', f);
        o.a = 3;
        ok(out === 'ff1f1', out);
        ok((num as any) === 3);
    });

    it('watch Object 性能', () =>
    {
        const o = { a: 1 };

        const num = 10000000;
        let out = '';
        const f = () => { out += 'f'; };
        let s = Date.now();
        for (let i = 0; i < num; i++)
        {
            o.a = i;
        }
        const t1 = Date.now() - s;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        out = '';
        watcher.watch(o, 'a', f);
        o.a = 2;
        watcher.unwatch(o, 'a', f);
        o.a = 3;
        s = Date.now();
        for (let i = 0; i < num; i++)
        {
            o.a = i;
        }
        const t2 = Date.now() - s;

        console.warn(`${t1}->${t2} watch与unwatch操作后性能 1->${t1 / t2}`);
        ok(true);
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
        ok(out === 'ff1f1', out);
        //
        out = '';
        watcher.unwatchchain(o, 'a.b.c', f1);
        o.a.b.c = 4;
        ok(out === '', out);
        //
        out = '';
        watcher.watchchain(o, 'a.b.c', f);
        o.a.b.c = 4;
        o.a.b.c = 5;
        ok(out === 'f', out);
        //
        out = '';
        o.a = { b: { c: 1 } };
        o.a.b.c = 3;
        ok(out === 'ff', `out:${out}`);
        //
        out = '';
        watcher.unwatchchain(o, 'a.b.c', f);
        o.a.b.c = 4;
        ok(out === '', `out:${out}`);
        //
        out = '';
        watcher.watchchain(o, 'a.b.c', f);
        o.a = <any>null;
        o.a = { b: { c: 1 } };
        o.a.b.c = 5;
        ok(out === 'fff', out);
    });

    // it('bind unbind', () =>
    // {
    //     const vec2 = new Vector2();
    //     const vec3 = new Vector3();
    //     const vec4 = new Vector4();

    //     watcher.bind(vec2, 'x', vec3, 'x');
    //     watcher.bind(vec2, 'x', vec4, 'x');

    //     let v = Math.random();

    //     vec2.x = v;
    //     equal(vec2.x, v);
    //     equal(vec2.x, vec3.x);
    //     equal(vec2.x, vec4.x);

    //     vec4.x = v = Math.random();
    //     equal(vec2.x, v);
    //     equal(vec2.x, vec3.x);
    //     equal(vec2.x, vec4.x);

    //     watcher.unbind(vec3, 'x', vec2, 'x');
    //     watcher.unbind(vec2, 'x', vec4, 'x');

    //     vec4.x = v = Math.random();
    //     equal(vec4.x, v);
    //     equal(vec2.x, vec3.x);

    //     ok(vec2.x !== v);
    // });

    it('watchobject', () =>
    {
        const o = { a: { b: { c: 1 }, d: 2 } };
        let out = '';
        const f = (_h, _p, _o) => { out += 'f'; };

        watcher.watchobject(o, { a: { b: { c: 0 }, d: 0 } }, f);
        // 添加监听后会自动生成 属性__watchchains__
        ok(!!o[__watchchains__]);

        out = '';
        o.a.b.c = 10; // 调用一次函数f
        o.a.d = 10;// 调用一次函数f
        equal(out, 'ff');

        watcher.unwatchobject(o, { a: { b: { c: 0 }, d: 0 } }, f);
        // 添加监听后会自动生成 属性__watchchains__
        ok(!o[__watchchains__]);

        out = '';
        o.a.b.c = 10; // 调用一次函数f
        o.a.d = 10;// 调用一次函数f
        equal(out, '');

        // 监听所有属性
        out = '';
        watcher.watchobject(o, o, f);
        ok(!!o[__watchchains__]);
        o.a.d = 100;
        o.a.b.c = 100;
        equal(out, 'ff');

        watcher.unwatchobject(o, o, f);
        ok(!o[__watchchains__]);
    });
});
