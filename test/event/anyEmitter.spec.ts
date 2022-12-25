/* eslint-disable camelcase */
/* eslint-disable func-style */
import { anyEmitter } from '../../src/event/AnyEmitter';
import { IEvent } from '../../src/event/IEvent';

import { assert, describe, expect, it } from 'vitest';
const { ok, equal, deepEqual, strictEqual } = assert;

it('可针对任意对象派发事件', () =>
{
    const result0 = ['0', '1', 'true', 'false', 'string', '{}'];
    const obj = {};

    const result: string[] = [];

    anyEmitter.on(0, 'print', () => { result.push('0'); });
    anyEmitter.on(1, 'print', () => { result.push('1'); });
    anyEmitter.on(true, 'print', () => { result.push('true'); });
    anyEmitter.on(false, 'print', () => { result.push('false'); });
    anyEmitter.on('string', 'print', () => { result.push('string'); });
    anyEmitter.on(obj, 'print', () => { result.push('{}'); });

    anyEmitter.emit(0, 'print');
    anyEmitter.emit(1, 'print');
    anyEmitter.emit(true, 'print');
    anyEmitter.emit(false, 'print');
    anyEmitter.emit('string', 'print');
    anyEmitter.emit(obj, 'print');

    strictEqual(result0.join('-'), result.join('-'));
});

it('on', () =>
{
    let out = '';
    //
    const n = 1;
    const s = 'a';
    const o = {};
    // 监听任意对象的任意事件

    anyEmitter.on(n, 'n', () => { out += 'n'; });
    anyEmitter.on(s, 's', () => { out += 's'; });
    anyEmitter.on(o, 'o', () => { out += 'o'; });
    // 派发事件
    anyEmitter.emit(n, 'n');
    anyEmitter.emit(s, 's');
    anyEmitter.emit(o, 'o');
    // 监听回调被正常调用
    ok(out === 'nso');

    // 再次派发事件
    anyEmitter.emit(o, 'o');
    anyEmitter.emit(s, 's');
    anyEmitter.emit(n, 'n');
    // 监听回调被正常调用
    strictEqual(out, 'nsoosn');

    out = '';
    // 使用obj作为回调函数的上下文
    const obj = { v: 1, fn(event: IEvent<any>) { out += event.type + this.v; } };

    anyEmitter.on(obj, 'click', obj.fn, obj);
    // 重复监听一次派发事件仅会被调用一次
    anyEmitter.on(obj, 'click', obj.fn, obj);
    anyEmitter.emit(obj, 'click');
    ok(out === 'click1');

    out = '';
    // 相同事件类似的监听器优先级越高越优先被调用

    anyEmitter.on(1, 'pevent', () => { out += 'p1'; }, null, 1);
    anyEmitter.on(1, 'pevent', () => { out += 'p0'; }, null, 0);
    anyEmitter.on(1, 'pevent', () => { out += 'p2'; }, null, 2);
    anyEmitter.emit(1, 'pevent');
    ok(out === 'p2p1p0');
});

it('off', () =>
{
    let out = '';
    let fn = () => { out += '1'; };
    // 监听后派发事件触发回调。

    anyEmitter.on(1, 'a', fn);
    anyEmitter.emit(1, 'a');
    ok(out === '1');

    // 移除监听后再次派发事件后并未触发监听回调。
    anyEmitter.off(1, 'a', fn);
    anyEmitter.emit(1, 'a');
    ok(out === '1');

    out = '';
    fn = () => { out += '1'; };
    let fn2 = () => { out += '2'; };

    anyEmitter.on(1, 'b', fn);
    anyEmitter.on(1, 'b', fn2);
    // off缺省监听回调时移除指定事件类型所有监听。
    anyEmitter.off(1, 'b');
    anyEmitter.emit(1, 'b');
    ok(!anyEmitter.has(1, 'b'));
    ok(out === '');

    out = '';
    fn = () => { out += '1'; };
    fn2 = () => { out += '2'; };

    anyEmitter.on(1, 'c', fn);
    anyEmitter.on(1, 'd', fn2);
    anyEmitter.onAny(1, fn2);
    // off 缺省 事件类型时将会移除指定对象上所有事件监听。
    anyEmitter.off(1);
    anyEmitter.emit(1, 'c');
    anyEmitter.emit(1, 'd');
    ok(!anyEmitter.has(1, 'c'));
    ok(!anyEmitter.has(1, 'd'));
    ok(out === '');
});

it('once', () =>
{
    // 只监听一次，被触发后自动移除监听。
    let out = '';

    anyEmitter.once(1, 'a', () => { out += '1'; });
    anyEmitter.emit(1, 'a');
    ok(out === '1');

    // 已经被移除，再次派发事件并不会被触发监听回调。
    anyEmitter.emit(1, 'a');
    ok(out === '1');
});

it('has', () =>
{
    // 新增监听，has检测到拥有该监听。
    let out = '';

    anyEmitter.on(1, 'a', () => { out += '1'; });
    ok(anyEmitter.has(1, 'a'));

    // 移除监听后，未检测到拥有该监听。
    anyEmitter.off(1, 'a');
    ok(!anyEmitter.has(1, 'a'));

    // 新增once监听，has检测到拥有该监听。
    anyEmitter.once(2, '2', () => { out += '2'; });
    ok(anyEmitter.has(2, '2'));

    // once被触发后自动被移除，未检测到该监听。
    anyEmitter.emit(2, '2');
    ok(!anyEmitter.has(2, '2'));
    console.log(out);
});

it('onAny offAny', () =>
{
    let out = '';
    const fn = (e: IEvent<any>) => { out += e.type; };
    // 新增一个对象的任意事件监听器。

    anyEmitter.onAny(1, fn);

    // 配发多个不同事件后均被触发监听器。
    anyEmitter.emit(1, 'a');
    anyEmitter.emit(1, 'b');
    anyEmitter.emit(1, 'c');
    ok(out === 'abc');

    // 移除后并不会再次被触发。
    anyEmitter.offAny(1, fn);
    anyEmitter.emit(1, 'a');
    anyEmitter.emit(1, 'b');
    anyEmitter.emit(1, 'c');
    strictEqual(out, 'abc');
});

it('emit bubbles', () =>
{
    // dispatch 携带数据 冒泡
    const data = { d: 0 };
    let out: IEvent<any> = null as any;
    let parent = { v: 0 };
    const getBubbleTargets = function getBubbleTargets(this: any) { return [this.parent]; };
    let child = { v: 1, parent, getBubbleTargets };

    anyEmitter.on(parent, 'b', (e) => { out = e; });
    anyEmitter.emit(child, 'b', data, true);
    ok(out.data === data);
    // 派发事件的对象
    ok(out.target === child);
    // 当前处理事件的对象
    ok(out.currentTarget === parent);
    // 事件冒泡流向
    ok(out.targets[0] === child);
    ok(out.targets[1] === parent);

    // 处理停止事件的冒泡
    parent = { v: 0 };
    child = { v: 1, parent, getBubbleTargets };
    let outstr = '';

    anyEmitter.on(child, 'b1', (e) => { e.isStopBubbles = true; }, null, -1); // 新增优先级较低的监听器，并停止冒泡行为。
    anyEmitter.on(child, 'b1', () => { outstr += 'child0'; }, null, 0); // 该监听器将会被触发。
    anyEmitter.on(child, 'b1', () => { outstr += 'child-1'; }, null, -2); // 该监听器将会被触发。
    anyEmitter.on(parent, 'b1', () => { outstr += 'parent'; }); // 冒泡被终止，该监听器不会被触发。
    anyEmitter.emit(child, 'b1', null, true);
    strictEqual(outstr, 'child0child-1');

    // 处理停止事件
    parent = { v: 0 };
    child = { v: 1, parent, getBubbleTargets };
    outstr = '';

    anyEmitter.on(child, 'b2', (e) => { e.isStop = true; }, null, -1); // 新增优先级较低的监听器，并停止事件流。
    anyEmitter.on(child, 'b2', () => { outstr += 'child0'; }, null, 0); // 该监听器将会被触发。
    anyEmitter.on(child, 'b2', () => { outstr += 'child-1'; }, null, -2); // 事件被终止，该监听器优先级较低将不会被触发。
    anyEmitter.on(parent, 'b2', () => { outstr += 'parent'; }); // 事件被终止，该监听器不会被触发。
    anyEmitter.emit(child, 'b2', null, true);
    strictEqual(outstr, 'child0');
});
