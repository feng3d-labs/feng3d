/* eslint-disable camelcase */
/* eslint-disable func-style */
import { ok, strictEqual } from 'assert';
import { event, Event, EventEmitter } from '../src';

describe('@feng3d/event', () =>
{
    it('可针对任意对象派发事件', () =>
    {
        const result0 = ['0', '1', 'true', 'false', 'string', '{}'];
        const obj = {};

        const result = [];

        event.on(0, 'print', () => { result.push('0'); });
        event.on(1, 'print', () => { result.push('1'); });
        event.on(true, 'print', () => { result.push('true'); });
        event.on(false, 'print', () => { result.push('false'); });
        event.on('string', 'print', () => { result.push('string'); });
        event.on(obj, 'print', () => { result.push('{}'); });

        event.emit(0, 'print');
        event.emit(1, 'print');
        event.emit(true, 'print');
        event.emit(false, 'print');
        event.emit('string', 'print');
        event.emit(obj, 'print');

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

        event.on(n, 'n', () => { out += 'n'; });
        event.on(s, 's', () => { out += 's'; });
        event.on(o, 'o', () => { out += 'o'; });
        // 派发事件
        event.emit(n, 'n');
        event.emit(s, 's');
        event.emit(o, 'o');
        // 监听回调被正常调用
        ok(out === 'nso');

        // 再次派发事件
        event.emit(o, 'o');
        event.emit(s, 's');
        event.emit(n, 'n');
        // 监听回调被正常调用
        strictEqual(out, 'nsoosn');

        out = '';
        // 使用obj作为回调函数的上下文
        const obj = { v: 1, fn(event: Event<any>) { out += event.type + this.v; } };

        event.on(obj, 'click', obj.fn, obj);
        // 重复监听一次派发事件仅会被调用一次
        event.on(obj, 'click', obj.fn, obj);
        event.emit(obj, 'click');
        ok(out === 'click1');

        out = '';
        // 相同事件类似的监听器优先级越高越优先被调用

        event.on(1, 'pevent', () => { out += 'p1'; }, null, 1);
        event.on(1, 'pevent', () => { out += 'p0'; }, null, 0);
        event.on(1, 'pevent', () => { out += 'p2'; }, null, 2);
        event.emit(1, 'pevent');
        ok(out === 'p2p1p0');
    });

    it('off', () =>
    {
        let out = '';
        let fn = () => { out += '1'; };
        // 监听后派发事件触发回调。

        event.on(1, 'a', fn);
        event.emit(1, 'a');
        ok(out === '1');

        // 移除监听后再次派发事件后并未触发监听回调。
        event.off(1, 'a', fn);
        event.emit(1, 'a');
        ok(out === '1');

        out = '';
        fn = () => { out += '1'; };
        let fn2 = () => { out += '2'; };

        event.on(1, 'b', fn);
        event.on(1, 'b', fn2);
        // off缺省监听回调时移除指定事件类型所有监听。
        event.off(1, 'b');
        event.emit(1, 'b');
        ok(!event.has(1, 'b'));
        ok(out === '');

        out = '';
        fn = () => { out += '1'; };
        fn2 = () => { out += '2'; };

        event.on(1, 'c', fn);
        event.on(1, 'd', fn2);
        event.onAny(1, fn2);
        // off 缺省 事件类型时将会移除指定对象上所有事件监听。
        event.off(1);
        event.emit(1, 'c');
        event.emit(1, 'd');
        ok(!event.has(1, 'c'));
        ok(!event.has(1, 'd'));
        ok(out === '');
    });

    it('once', () =>
    {
        // 只监听一次，被触发后自动移除监听。
        let out = '';

        event.once(1, 'a', () => { out += '1'; });
        event.emit(1, 'a');
        ok(out === '1');

        // 已经被移除，再次派发事件并不会被触发监听回调。
        event.emit(1, 'a');
        ok(out === '1');
    });

    it('has', () =>
    {
        // 新增监听，has检测到拥有该监听。
        let out = '';

        event.on(1, 'a', () => { out += '1'; });
        ok(event.has(1, 'a'));

        // 移除监听后，未检测到拥有该监听。
        event.off(1, 'a');
        ok(!event.has(1, 'a'));

        // 新增once监听，has检测到拥有该监听。
        event.once(2, '2', () => { out += '2'; });
        ok(event.has(2, '2'));

        // once被触发后自动被移除，未检测到该监听。
        event.emit(2, '2');
        ok(!event.has(2, '2'));
        console.log(out);
    });

    it('onAny offAny', () =>
    {
        let out = '';
        const fn = (e: Event<any>) => { out += e.type; };
        // 新增一个对象的任意事件监听器。

        event.onAny(1, fn);

        // 配发多个不同事件后均被触发监听器。
        event.emit(1, 'a');
        event.emit(1, 'b');
        event.emit(1, 'c');
        ok(out === 'abc');

        // 移除后并不会再次被触发。
        event.offAny(1, fn);
        event.emit(1, 'a');
        event.emit(1, 'b');
        event.emit(1, 'c');
        strictEqual(out, 'abc');
    });

    it('emit bubbles', () =>
    {
        // dispatch 携带数据 冒泡
        const data = { d: 0 };
        let out: Event<any> = null;
        let parent = { v: 0 };
        const __event_bubble_function__ = function __event_bubble_function__() { return [this.parent]; };
        // feng3d.__event_bubble_function__
        let child = { v: 1, parent, __event_bubble_function__ };

        event.on(parent, 'b', (e) => { out = e; });
        event.emit(child, 'b', data, true);
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
        child = { v: 1, parent, __event_bubble_function__ };
        let outstr = '';

        event.on(child, 'b1', (e) => { e.isStopBubbles = true; }, null, -1); // 新增优先级较低的监听器，并停止冒泡行为。
        event.on(child, 'b1', () => { outstr += 'child0'; }, null, 0); // 该监听器将会被触发。
        event.on(child, 'b1', () => { outstr += 'child-1'; }, null, -2); // 该监听器将会被触发。
        event.on(parent, 'b1', () => { outstr += 'parent'; }); // 冒泡被终止，该监听器不会被触发。
        event.emit(child, 'b1', null, true);
        strictEqual(outstr, 'child0child-1');

        // 处理停止事件
        parent = { v: 0 };
        child = { v: 1, parent, __event_bubble_function__ };
        outstr = '';

        event.on(child, 'b2', (e) => { e.isStop = true; }, null, -1); // 新增优先级较低的监听器，并停止事件流。
        event.on(child, 'b2', () => { outstr += 'child0'; }, null, 0); // 该监听器将会被触发。
        event.on(child, 'b2', () => { outstr += 'child-1'; }, null, -2); // 事件被终止，该监听器优先级较低将不会被触发。
        event.on(parent, 'b2', () => { outstr += 'parent'; }); // 事件被终止，该监听器不会被触发。
        event.emit(child, 'b2', null, true);
        strictEqual(outstr, 'child0');
    });

    it('emit bubbles Entity-Component-System', () =>
    {
        class Component
        {
            name: string;
            entity: Entity;
            constructor(name = 'component')
            {
                this.name = name;
            }

            /**
             * feng3d.__event_bubble_function__
             */
            __event_bubble_function__(): any[]
            {
                return [this.entity];
            }
        }

        class Entity
        {
            name: string;
            components: Component[];
            constructor(name = 'entity')
            {
                this.name = name;
            }

            /**
             * feng3d.__event_bubble_function__
             */
            __event_bubble_function__()
            {
                return this.components;
            }
        }

        class Node extends Component
        {
            parent: Node;
            static create(name?: string)
            {
                const entity = new Entity(`entity-${name}`);
                const node = new Node(`node-${name}`);

                entity.components = [
                    node, new Component(`component0-${name}`), new Component(`component1-${name}`),
                ];
                entity.components.forEach((c) =>
                {
                    c.entity = entity;
                });

                return node;
            }

            /**
             * feng3d.__event_bubble_function__
             */
            __event_bubble_function__()
            {
                return [this.entity as any].concat(this.entity.components, this.parent);
            }
        }

        const nodea = Node.create('a');
        const nodeb = Node.create('b');

        nodeb.parent = nodea;

        const result = [];

        [].concat(nodea.entity, nodea.entity.components, nodeb.entity, nodeb.entity.components).forEach((v) =>
        {
            event.on(v, 'print', () => { result.push(v.name); });
        });

        event.emit(nodeb, 'print', null, true);
        const result0 = ['node-b', 'entity-b', 'component0-b', 'component1-b', 'node-a', 'entity-a', 'component0-a', 'component1-a'];

        strictEqual(result0.join(','), result.join(','));
    });

    it('emit bubbles Entity-Component-System extends EventEmitter', () =>
    {
        interface ComponentEventMap
        {
            print: any;
        }

        class Component<T extends ComponentEventMap = ComponentEventMap> extends EventEmitter<T>
        {
            name: string;
            entity: Entity;
            constructor(name = 'component')
            {
                super();
                this.name = name;
            }

            /**
             * feng3d.__event_bubble_function__
             */
            __event_bubble_function__(): any[]
            {
                return [this.entity];
            }
        }

        type EntityEventMap = ComponentEventMap;

        class Entity<T extends EntityEventMap = EntityEventMap> extends EventEmitter<T>
        {
            name: string;
            components: Component[];
            constructor(name = 'entity')
            {
                super();
                this.name = name;
            }

            /**
             * feng3d.__event_bubble_function__
             */
            __event_bubble_function__()
            {
                return this.components;
            }
        }

        class Node extends Component
        {
            parent: Node;
            static create(name?: string)
            {
                const entity = new Entity(`entity-${name}`);
                const node = new Node(`node-${name}`);

                entity.components = [
                    node, new Component(`component0-${name}`), new Component(`component1-${name}`),
                ];
                entity.components.forEach((c) =>
                {
                    c.entity = entity;
                });

                return node;
            }

            /**
             * feng3d.__event_bubble_function__
             */
            __event_bubble_function__()
            {
                return [this.entity as any].concat(this.entity.components, this.parent);
            }
        }

        const nodea = Node.create('a');
        const nodeb = Node.create('b');

        nodeb.parent = nodea;

        const result = [];
        const listenerFunc = function listenerFunc() { result.push(this.name); };

        // ---------- 使用 event 派发事件。

        // 首次添加事件
        [].concat(nodea.entity, nodea.entity.components, nodeb.entity, nodeb.entity.components).forEach((v: Component) =>
        {
            event.on(v, 'print', listenerFunc, v);
        });

        event.emit(nodeb, 'print', null, true);

        const result0 = ['node-b', 'entity-b', 'component0-b', 'component1-b', 'node-a', 'entity-a', 'component0-a', 'component1-a'];

        strictEqual(result0.join(','), result.join(','));

        // 再次添加事件，重复添加事件将被忽略
        result.length = 0;
        [].concat(nodea.entity, nodea.entity.components, nodeb.entity, nodeb.entity.components).forEach((v: Component) =>
        {
            event.on(v, 'print', listenerFunc, v);
        });

        event.emit(nodeb, 'print', null, true);
        strictEqual(result0.join(','), result.join(','));

        // 移除事件
        result.length = 0;
        [].concat(nodea.entity, nodea.entity.components, nodeb.entity, nodeb.entity.components).forEach((v: Component) =>
        {
            event.off(v, 'print', listenerFunc, v);
        });

        event.emit(nodeb, 'print', null, true);
        strictEqual('', result.join(','));

        // ---------- 使用 EventEmitter 派发事件。
        result.length = 0;
        [].concat(nodea.entity, nodea.entity.components, nodeb.entity, nodeb.entity.components).forEach((v: Component) =>
        {
            v.on('print', listenerFunc, v);
        });

        nodeb.emit('print', null, true);

        strictEqual(result0.join(','), result.join(','));

        //
        result.length = 0;
        [].concat(nodea.entity, nodea.entity.components, nodeb.entity, nodeb.entity.components).forEach((v: Component) =>
        {
            v.on('print', listenerFunc, v);
        });

        nodeb.entity.emit('print', null, true);
        const result1 = ['entity-b', 'node-b', 'component0-b', 'component1-b', 'node-a', 'entity-a', 'component0-a', 'component1-a'];

        strictEqual(result1.join(','), result.join(','));

        //
        result.length = 0;
        [].concat(nodea.entity, nodea.entity.components, nodeb.entity, nodeb.entity.components).forEach((v: Component) =>
        {
            v.on('print', listenerFunc, v);
        });

        nodeb.entity.components[2].emit('print', null, true);
        const result2 = ['component1-b', 'entity-b', 'node-b', 'component0-b', 'node-a', 'entity-a', 'component0-a', 'component1-a'];

        strictEqual(result2.join(','), result.join(','));
    });
});
