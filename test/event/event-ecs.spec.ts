import { EventEmitter } from '../../src/event/EventEmitter';
import { IEvent } from '../../src/event/IEvent';
import { IEventTarget } from '../../src/event/IEventTarget';

import { assert, describe, expect, it } from 'vitest'
const { ok, equal, deepEqual } = assert;

// 要求
// 1. Entity可以发射事件，Component无法发射事件。
// 2. Entity发射的事件将会在Node组件之间传递，包括冒泡（向父结点传递）与广播（向子结点传递）。

interface EntityEventMap
{
    print: any;
}

/**
 * 组件上的事件将分享到实体上。
 */
class Component extends EventEmitter<EntityEventMap> implements IEventTarget
{
    name: string;
    entity: Entity;
    constructor(name = 'Component')
    {
        super();
        this.name = name;
        // 输出名称
        this.on('print', listenerFunc, this);
    }

    /**
     * 把事件分享到实体上。
     */
    getShareTargets()
    {
        return [this.entity];
    }
}

/**
 * 实体上的事件将分享到每个组件上。
 */
class Entity extends EventEmitter<EntityEventMap> implements IEventTarget
{
    name: string;
    node: Node;
    components: Component[];
    constructor(name = 'Entity')
    {
        super();
        this.name = name;
        // 输出名称
        this.on('print', listenerFunc, this);
    }

    /**
     * 把事件分享到每个组件上。
     */
    getShareTargets()
    {
        return this.components;
    }

    /**
     * 把事件汇报给父结点。
     */
    getBubbleTargets()
    {
        const targets = [this.node?.parent?.entity];

        return targets;
    }

    /**
     * 把事件广播给每个子结点。
     */
    getBroadcastTargets()
    {
        const targets = this.node?.children?.map((v) => v.entity);

        return targets;
    }
}

class Node extends Component
{
    parent: Node;
    children: Node[] = [];
    static create(name?: string)
    {
        const entity = new Entity(`Entity-${name}`);
        const node = new Node(`Node-${name}`);
        entity.node = node;
        entity.components = [
            node, new Component(`Component0-${name}`), new Component(`Component1-${name}`),
        ];
        entity.components.forEach((c) =>
        {
            c.entity = entity;
        });

        return node;
    }
}

const grandfather = Node.create('grandfather');
const parent = Node.create('parent');
const self = Node.create('self');
const brother = Node.create('brother');
const child0 = Node.create('child0');
const child1 = Node.create('child1');

grandfather.children = [parent];

parent.parent = grandfather;
parent.children = [brother, self];

brother.parent = parent;

self.parent = parent;
self.children = [child0, child1];

child0.parent = self;
child1.parent = self;

const result: string[] = [];
let resultEvent: IEvent;

function listenerFunc()
{
    result.push(this.name);
}

// 停止冒泡、广播以及事件处理。
function stop(event: IEvent<any>)
{
    event.isStop = true;
}

function stopTransmit(event: IEvent<any>)
{
    event.isStopTransmit = true;
}

// 停止冒泡
function stopBubbles(event: IEvent<any>)
{
    event.isStopBubbles = true;
}

// 停止广播
function stopBroadcast(event: IEvent<any>)
{
    event.isStopBroadcast = true;
}

it('emit bubbles 冒泡', () =>
{
    // 冒泡
    result.length = 0;
    resultEvent = self.entity.emit('print', null, true);// 冒泡
    deepEqual([
        'Entity-self', 'Node-self', 'Component0-self', 'Component1-self',
        'Entity-parent', 'Node-parent', 'Component0-parent', 'Component1-parent',
        'Entity-grandfather', 'Node-grandfather', 'Component0-grandfather', 'Component1-grandfather',
    ], result);
    deepEqual(resultEvent.handles.length, 12);
    deepEqual(resultEvent.targets.length, 12);
    deepEqual(resultEvent.target, self.entity);
});

it('emit broadcast 广播', () =>
{
    // 广播
    result.length = 0;
    resultEvent = self.entity.emit('print', null, false, true);
    deepEqual([
        'Entity-self', 'Node-self', 'Component0-self', 'Component1-self',
        'Entity-child0', 'Node-child0', 'Component0-child0', 'Component1-child0',
        'Entity-child1', 'Node-child1', 'Component0-child1', 'Component1-child1',
    ], result);
});

it('emit 同时冒泡与广播', () =>
{
    result.length = 0;
    resultEvent = self.entity.emit('print', null, true, true);
    deepEqual([
        'Entity-self', 'Node-self', 'Component0-self', 'Component1-self',
        'Entity-parent', 'Node-parent', 'Component0-parent', 'Component1-parent',
        'Entity-grandfather', 'Node-grandfather', 'Component0-grandfather', 'Component1-grandfather',
        'Entity-child0', 'Node-child0', 'Component0-child0', 'Component1-child0',
        'Entity-child1', 'Node-child1', 'Component0-child1', 'Component1-child1',
    ], result);
});

it('bubbles 冒泡事件', () =>
{
    result.length = 0;
    resultEvent = self.entity.bubbles('print', null);
    deepEqual([
        'Entity-self', 'Node-self', 'Component0-self', 'Component1-self',
        'Entity-parent', 'Node-parent', 'Component0-parent', 'Component1-parent',
        'Entity-grandfather', 'Node-grandfather', 'Component0-grandfather', 'Component1-grandfather',
    ], result);
});

it('broadcast 广播事件', () =>
{
    result.length = 0;
    resultEvent = self.entity.broadcast('print', null);
    deepEqual([
        'Entity-self', 'Node-self', 'Component0-self', 'Component1-self',
        'Entity-child0', 'Node-child0', 'Component0-child0', 'Component1-child0',
        'Entity-child1', 'Node-child1', 'Component0-child1', 'Component1-child1',
    ], result);
    deepEqual(resultEvent.handles.length, 12);
});

it('IEvent.isStop 测试停止事件', () =>
{
    // 停止事件
    self.entity.on('print', stop);
    //
    result.length = 0;
    resultEvent = self.entity.broadcast('print', null);
    deepEqual([
        'Entity-self',
    ], result);
    deepEqual(resultEvent.handles.length, 2);

    // 恢复停止事件
    self.entity.off('print', stop);
    result.length = 0;
    resultEvent = self.entity.emit('print', null, true, true);
    deepEqual([
        'Entity-self', 'Node-self', 'Component0-self', 'Component1-self',
        'Entity-parent', 'Node-parent', 'Component0-parent', 'Component1-parent',
        'Entity-grandfather', 'Node-grandfather', 'Component0-grandfather', 'Component1-grandfather',
        'Entity-child0', 'Node-child0', 'Component0-child0', 'Component1-child0',
        'Entity-child1', 'Node-child1', 'Component0-child1', 'Component1-child1',
    ], result);
    deepEqual(resultEvent.handles.length, 20);
});

it('IEvent.isStopTransmit 测试停止传播事件', () =>
{
    // 停止传播事件
    self.entity.on('print', stopTransmit);
    //
    result.length = 0;
    resultEvent = self.entity.broadcast('print', null); // 事件在entity上被停止传播，无法传递到组件上。
    deepEqual([
        'Entity-self',
    ], result);
    deepEqual(resultEvent.handles.length, 2);

    // 恢复停止事件
    self.entity.off('print', stopTransmit);
    result.length = 0;
    resultEvent = self.entity.emit('print', null, true, true);
    deepEqual([
        'Entity-self', 'Node-self', 'Component0-self', 'Component1-self',
        'Entity-parent', 'Node-parent', 'Component0-parent', 'Component1-parent',
        'Entity-grandfather', 'Node-grandfather', 'Component0-grandfather', 'Component1-grandfather',
        'Entity-child0', 'Node-child0', 'Component0-child0', 'Component1-child0',
        'Entity-child1', 'Node-child1', 'Component0-child1', 'Component1-child1',
    ], result);
    deepEqual(resultEvent.handles.length, 20);
});

it('IEvent.isStopBubbles 测试停止冒泡', () =>
{
    // 停止冒泡
    self.entity.on('print', stopBubbles);
    //
    result.length = 0;
    resultEvent = self.entity.emit('print', null, true, true);
    deepEqual([
        'Entity-self', 'Node-self', 'Component0-self', 'Component1-self',
        'Entity-child0', 'Node-child0', 'Component0-child0', 'Component1-child0',
        'Entity-child1', 'Node-child1', 'Component0-child1', 'Component1-child1',
    ], result);
    deepEqual(resultEvent.handles.length, 13);

    // 恢复冒泡
    self.entity.off('print', stopBubbles);
    result.length = 0;
    resultEvent = self.entity.emit('print', null, true, true);
    deepEqual([
        'Entity-self', 'Node-self', 'Component0-self', 'Component1-self',
        'Entity-parent', 'Node-parent', 'Component0-parent', 'Component1-parent',
        'Entity-grandfather', 'Node-grandfather', 'Component0-grandfather', 'Component1-grandfather',
        'Entity-child0', 'Node-child0', 'Component0-child0', 'Component1-child0',
        'Entity-child1', 'Node-child1', 'Component0-child1', 'Component1-child1',
    ], result);
    deepEqual(resultEvent.handles.length, 20);
});

it('IEvent.isStopBroadcast 测试停止广播', () =>
{
    //
    self.entity.on('print', stopBroadcast);
    //
    result.length = 0;
    resultEvent = self.entity.emit('print', null, true, true);
    deepEqual([
        'Entity-self', 'Node-self', 'Component0-self', 'Component1-self',
        'Entity-parent', 'Node-parent', 'Component0-parent', 'Component1-parent',
        'Entity-grandfather', 'Node-grandfather', 'Component0-grandfather', 'Component1-grandfather',
    ], result);
    deepEqual(resultEvent.handles.length, 13);

    // 恢复广播
    self.entity.off('print', stopBroadcast);
    result.length = 0;
    resultEvent = self.entity.emit('print', null, true, true);
    deepEqual([
        'Entity-self', 'Node-self', 'Component0-self', 'Component1-self',
        'Entity-parent', 'Node-parent', 'Component0-parent', 'Component1-parent',
        'Entity-grandfather', 'Node-grandfather', 'Component0-grandfather', 'Component1-grandfather',
        'Entity-child0', 'Node-child0', 'Component0-child0', 'Component1-child0',
        'Entity-child1', 'Node-child1', 'Component0-child1', 'Component1-child1',
    ], result);
    deepEqual(resultEvent.handles.length, 20);
});
