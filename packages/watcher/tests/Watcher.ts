// import { watcher } from '@feng3d/watcher';

// QUnit.module('watcher', () =>
// {
//     QUnit.test('watch Object', (assert) =>
//     {
//         const o = { a: 1 };
//         let out = '';
//         const f = (h, p, o) => { out += 'f'; };
//         const f1 = (h, p, o) => { out += 'f1'; };

//         feng3d.watcher.watch(o, 'a', f);
//         watcher.watch(o, 'a', f1);
//         o.a = 2;
//         watcher.unwatch(o, 'a', f);
//         o.a = 3;
//         assert.ok(out === 'ff1f1', out);
//     });

//     QUnit.test('watch custom A', (assert) =>
//     {
//         class A
//         {
//             get a()
//             {
//                 return this._a;
//             }
//             set a(v)
//             {
//                 this._a = v;
//                 num = v;
//             }
//             private _a = 1;
//         }
//         const o = new A();
//         var num = 0;
//         let out = '';
//         const f = (h, p, o) => { out += 'f'; };
//         const f1 = (h, p, o) => { out += 'f1'; };

//         watcher.watch(o, 'a', f);
//         watcher.watch(o, 'a', f1);
//         o.a = 2;
//         assert.ok(num === 2);
//         watcher.unwatch(o, 'a', f);
//         o.a = 3;
//         assert.ok(out === 'ff1f1', out);
//         assert.ok(num === 3);
//     });

//     QUnit.test('watch Object 性能', (assert) =>
//     {
//         const o = { a: 1 };

//         const num = 10000000;
//         let out = '';
//         const f = () => { out += 'f'; };
//         var s = Date.now();

//         for (let i = 0; i < num; i++)
//         {
//             o.a = i;
//         }
//         const t1 = Date.now() - s;

//         out = '';
//         watcher.watch(o, 'a', f);
//         o.a = 2;
//         watcher.unwatch(o, 'a', f);
//         o.a = 3;
//         var s = Date.now();

//         for (let i = 0; i < num; i++)
//         {
//             o.a = i;
//         }
//         const t2 = Date.now() - s;

//         assert.ok(true, `${t1}->${t2} watch与unwatch操作后性能 1->${t1 / t2}`);
//     });

//     QUnit.test('watchchain Object', (assert) =>
//     {
//         const o = { a: { b: { c: 1 } } };
//         let out = '';
//         const f = (h, p, o) => { out += 'f'; };
//         const f1 = (h, p, o) => { out += 'f1'; };

//         watcher.watchchain(o, 'a.b.c', f);
//         watcher.watchchain(o, 'a.b.c', f1);
//         o.a.b.c = 2;
//         watcher.unwatchchain(o, 'a.b.c', f);
//         o.a.b.c = 3;
//         assert.ok(out === 'ff1f1', out);
//         //
//         out = '';
//         watcher.unwatchchain(o, 'a.b.c', f1);
//         o.a.b.c = 4;
//         assert.ok(out === '', out);
//         //
//         out = '';
//         watcher.watchchain(o, 'a.b.c', f);
//         o.a.b.c = 4;
//         o.a.b.c = 5;
//         assert.ok(out === 'f', out);
//         //
//         out = '';
//         o.a = { b: { c: 1 } };
//         o.a.b.c = 3;
//         assert.ok(out === 'ff', `out:${out}`);
//         //
//         out = '';
//         watcher.unwatchchain(o, 'a.b.c', f);
//         o.a.b.c = 4;
//         assert.ok(out === '', `out:${out}`);
//         //
//         out = '';
//         watcher.watchchain(o, 'a.b.c', f);
//         o.a = null;
//         o.a = { b: { c: 1 } };
//         o.a.b.c = 5;
//         assert.ok(out === 'fff', out);
//     });
// });
