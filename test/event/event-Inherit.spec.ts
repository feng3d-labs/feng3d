import { ok } from 'assert';
import { EventEmitter } from '../../src/event/EventEmitter';

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

it('事件被继承，代码提示无误', () =>
{
    const eventEmitter = new EventEmitter();
    eventEmitter.on('abc', () => { });

    const object = new DisplayObject();
    const container = new Container();

    //
    object.on('added', () => { });
    object.on('removed', () => { });

    //
    container.on('added', () => { });// 继承自DisplayObject的事件
    container.on('removed', () => { });// 继承自DisplayObject的事件
    container.on('childAdded', () => { });
    container.on('childRemoved', () => { });

    ok(true);
});
