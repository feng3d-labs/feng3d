import { assert, test } from 'vitest';
import { EventEmitter, IEventTarget } from '../../src/packages/event/src';

const { deepEqual } = assert;

test('broadcast & bubbles', () =>
{
    class Node extends EventEmitter implements IEventTarget
    {
        parent: Node;
        children: Node[];

        constructor(public name: string)
        {
            super();
        }

        getBubbleTargets()
        {
            return [this.parent];
        }

        getBroadcastTargets()
        {
            return this.children;
        }
    }

    const parent = new Node('parent');
    const child0 = new Node('child0');
    const child1 = new Node('child1');
    parent.children = [child0, child1];
    child0.parent = parent;
    child1.parent = parent;

    const result: string[] = [];
    parent.on('event0', () => { result.push('parent'); });
    child0.on('event0', () => { result.push('child0'); });
    child1.on('event0', () => { result.push('child1'); });

    // 测试广播
    result.length = 0;
    child0.broadcast('event0');
    deepEqual(result, ['child0']);

    // 测试广播
    result.length = 0;
    parent.broadcast('event0');
    deepEqual(result, ['parent', 'child0', 'child1']);

    // 测试冒泡
    result.length = 0;
    child0.bubbles('event0');
    deepEqual(result, ['child0', 'parent']);

    // 测试冒泡
    result.length = 0;
    parent.bubbles('event0');
    deepEqual(result, ['parent']);
});
