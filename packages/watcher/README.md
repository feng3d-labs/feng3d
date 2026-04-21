# @feng3d/watcher

用于监听对象属性的变化以及同步两个对象的属性值。

源码：https://gitee.com/feng3d/watcher

文档：https://feng3d.com/watcher

## 网站

https://feng3d.com/watcher

## 安装
```
npm install @feng3d/watcher
```

## 示例

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
### 监听对象多个属性变化
```
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
equal(changeCount, 1); // 触发改变一次

changeCount = 0;
transform.position.x = transform.position.x + 0;
equal(changeCount, 0); // 赋予相同的值不会触发改变

changeCount = 0;
transform.position = { x: Math.random(), y: Math.random(), z: Math.random() };
equal(changeCount, 3); // x、y、z均改变

changeCount = 0;
transform.position = { x: transform.position.x, y: transform.position.y, z: transform.position.z };
equal(changeCount, 0); // x、y、z均未改变

// 移除监听变化
watcher.unwatchobject(transform, { position: { x: 0, y: 0, z: 0 }, angle: { x: 0, y: 0, z: 0 }, scale: { x: 0, y: 0, z: 0 } }, onChanged);

changeCount = 0;
transform.position = { x: Math.random(), y: Math.random(), z: Math.random() };
equal(changeCount, 0); // 无法监听到x、y、z改变
```