import { EventEmitter } from '../src';

import { assert, describe, it } from 'vitest';

interface DisplayObjectEventMap
{
    removed: Container;
    added: Container;
}

class DisplayObject<T extends DisplayObjectEventMap = DisplayObjectEventMap> extends EventEmitter<T>
{
}

interface ContainerEventMap extends DisplayObjectEventMap
{
    childAdded: { child: DisplayObject, parent: Container, index: number }
    childRemoved: { child: DisplayObject, parent: Container, index: number }
}

class Container<T extends ContainerEventMap = ContainerEventMap> extends DisplayObject<T>
{
}

/**
 * 泛型事件映射（`EventEmitter<T>`）的继承：子类的事件映射扩展父类映射，
 * 两类事件都要能监听、能派发。
 *
 * 原用例只写了「注册一堆监听器 + `assert.ok(true)`」——注册本身不会失败，
 * 所以它恒真、什么都没验证（而且断言的是编译期行为，而 `test/` 不在 tsc 的
 * include 里，连类型层面都没守着）。这里换成运行时可观测的行为。
 */
describe('事件类型继承', () =>
{
    it('子类能监听并派发继承自父类的事件', () =>
    {
        const container = new Container();
        const received: string[] = [];

        // 继承自 DisplayObject 的事件
        container.on('added', () => { received.push('added'); });
        container.on('removed', () => { received.push('removed'); });

        container.emit('added', container);
        container.emit('removed', container);

        assert.deepEqual(received, ['added', 'removed']);
    });

    it('子类自己的事件与继承的事件各自独立计数', () =>
    {
        const container = new Container();

        assert.equal(container.listenerCount('childAdded'), 0);
        assert.equal(container.has('childAdded'), false);

        container.on('childAdded', () => { });
        container.on('added', () => { });

        assert.equal(container.listenerCount('childAdded'), 1);
        assert.equal(container.listenerCount('added'), 1);
        assert.equal(container.has('childAdded'), true);
        assert.equal(container.has('added'), true);
        assert.equal(container.has('childRemoved'), false);
    });

    it('事件数据按类型原样传给监听器', () =>
    {
        const container = new Container();
        const child = new DisplayObject();
        let data: { child: DisplayObject, parent: Container, index: number } | undefined;

        container.on('childAdded', (e) => { data = e.data; });
        container.emit('childAdded', { child, parent: container, index: 3 });

        assert.ok(data);
        assert.strictEqual(data.child, child);
        assert.strictEqual(data.parent, container);
        assert.strictEqual(data.index, 3);
    });

    it('off 之后不再收到事件', () =>
    {
        const container = new Container();
        let count = 0;
        const listener = () => { count++; };

        container.on('added', listener);
        container.emit('added', container);
        assert.equal(count, 1);

        container.off('added', listener);
        container.emit('added', container);
        assert.equal(count, 1);
        assert.equal(container.has('added'), false);
    });

    it('EventEmitter 支持任意事件名（与具体事件映射的发射器共享单例）', () =>
    {
        const eventEmitter = new EventEmitter();
        let count = 0;

        eventEmitter.on('abc', () => { count++; });
        eventEmitter.emit('abc');

        assert.equal(count, 1);
    });
});
