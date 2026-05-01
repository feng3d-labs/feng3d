# @feng3d/watcher
用于监听对象属性的变化以及同步两个对象的属性值。

### 监听对象属性的变化
```
const { watcher } = require('@feng3d/watcher');

const o = { a: 1 };
let out = '';
const f = (_h, _p, _o) => { out += 'f'; };
const f1 = (_h, _p, _o) => { out += 'f1'; };
watcher.watch(o, 'a', f);
watcher.watch(o, 'a', f1);
o.a = 2;
watcher.unwatch(o, 'a', f);
o.a = 3;
console.assert(out === 'ff1f1', out);
```

### 绑定两个对象的指定属性，保存两个属性值同步。
```
const { watcher } = require('@feng3d/watcher');

const o1 = { a: 1 };
const o2 = { a: 1 };

watcher.bind(o1, 'a', o2, 'a');

o1.a = 2;
console.assert(o1.a == o2.a && o2.a === 2);

o2.a = 5;
console.assert(o1.a == o2.a && o1.a === 5);
```

### 监听对象属性链值变化
```
const { watcher } = require('@feng3d/watcher');

const o = { a: { b: { c: 1 } } };
let out = '';
const f = (_h, _p, _o) => { out += 'f'; };
const f1 = (_h, _p, _o) => { out += 'f1'; };
watcher.watchchain(o, 'a.b.c', f);
watcher.watchchain(o, 'a.b.c', f1);
o.a.b.c = 2;
watcher.unwatchchain(o, 'a.b.c', f);
o.a.b.c = 3;
console.assert(out === 'ff1f1', out);
//
out = '';
watcher.unwatchchain(o, 'a.b.c', f1);
o.a.b.c = 4;
console.assert(out === '', out);
//
out = '';
watcher.watchchain(o, 'a.b.c', f);
o.a.b.c = 4;
o.a.b.c = 5;
console.assert(out === 'f', out);
//
out = '';
o.a = { b: { c: 1 } };
o.a.b.c = 3;
console.assert(out === 'ff', `out:${out}`);
//
out = '';
watcher.unwatchchain(o, 'a.b.c', f);
o.a.b.c = 4;
console.assert(out === '', `out:${out}`);
//
out = '';
watcher.watchchain(o, 'a.b.c', f);
o.a = null;
o.a = { b: { c: 1 } };
o.a.b.c = 5;
console.assert(out === 'fff', out);
```