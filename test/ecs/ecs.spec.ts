import { Entity } from '@feng3d/ecs';
import { IEvent } from '@feng3d/event';
import { assert, describe, it } from 'vitest';
import { Node } from '../../src';
const { ok, equal, deepEqual, strictEqual } = assert;

describe('ECS中事件系统', () =>
{
    it('实体与组件事件互通', () =>
    {
        const entity = new Entity();
        const component = entity.addComponent('Component');

        let emitData = { value: Math.random() }; // 发射的数据
        let receiveData: any; // 接收到的数据

        // 实体监听事件
        entity.emitter.on('customEvent' as any, (e) =>
        {
            receiveData = e.data;
        });
        // 组件派发事件
        component.emitter.emit('customEvent' as any, emitData);

        // 实体成功接收到来自组件的事件
        equal(emitData, receiveData);

        emitData = { value: Math.random() }; // 发射的数据
        receiveData = null;

        // 实体移除监听
        entity.emitter.off('customEvent' as any);
        // 组件派发事件
        component.emitter.emit('customEvent' as any, emitData);

        // 实体不再接收到来自组件的事件
        equal(null, receiveData);

        emitData = { value: Math.random() }; // 发射的数据
        receiveData = null;

        // 实体监听事件
        component.emitter.on('customEvent' as any, (e) =>
        {
            receiveData = e.data;
        });
        // 组件派发事件
        entity.emitter.emit('customEvent' as any, emitData);

        // 组件成功接收到来自实体的事件
        equal(receiveData, emitData);
    });

    it('实体与组件事件冒泡与广播', () =>
    {
        let emitData: any; // 发射的数据
        let receiveData: any; // 接收到的数据

        function onCustomEvent(e: IEvent<any>)
        {
            receiveData = e.data;
        }

        // 父节点
        const parent = new Node();

        // 子结点
        const child = new Node();
        // 子结点组件
        const childComponent = child.addComponent('Component');
        // 建立父子结点关系
        parent.addChild(child);

        // 实体监听事件
        parent.emitter.on('customEvent' as any, onCustomEvent);

        // 子结点派发冒泡事件
        emitData = { value: Math.random() };
        receiveData = null;
        child.emitter.emit('customEvent' as any, emitData, true);
        // 实体成功接收到来自子结点的事件
        equal(emitData, receiveData);

        // 子结点组件派发冒泡事件
        emitData = { value: Math.random() };
        receiveData = null;
        childComponent.emitter.emit('customEvent' as any, emitData, true);
        // 实体成功接收到来自子结点组件的事件
        equal(emitData, receiveData);

        // 实体移除监听
        parent.emitter.off('customEvent' as any);
        // 组件派发事件
        emitData = { value: Math.random() };
        receiveData = null;
        child.emitter.emit('customEvent' as any, emitData);
        // 父结点不再接收到来自子结点的事件
        equal(null, receiveData);
    });

    it('实体与组件事件冒泡与广播', () =>
    {
        let emitData: any; // 发射的数据
        let receiveData: any; // 接收到的数据

        function onCustomEvent(e: IEvent<any>)
        {
            receiveData = e.data;
        }

        // 父节点
        const parent = new Node();
        // 父节点组件
        const parentComponent = parent.addComponent('Component');

        // 子结点
        const child = new Node();
        // 子结点组件
        const childComponent = child.addComponent('Component');
        // 建立父子结点关系
        parent.addChild(child);

        // 子结点监听事件
        child.emitter.on('customEvent' as any, onCustomEvent);
        // 父结点派发广播事件
        emitData = { value: Math.random() };
        receiveData = null;
        parent.emitter.emit('customEvent' as any, emitData, false, true);
        // 子结点成功接收到来自父结点的广播事件
        equal(receiveData, emitData);

        // 父结点组件广播事件
        emitData = { value: Math.random() };
        receiveData = null;
        parentComponent.emitter.emit('customEvent' as any, emitData, false, true);
        // 子结点成功接收到来自父结点组件的广播事件
        equal(receiveData, emitData);

        // 更换为子结点组件监听事件
        child.emitter.off('customEvent' as any);
        childComponent.emitter.on('customEvent' as any, onCustomEvent);
        // 父结点派发广播事件
        emitData = { value: Math.random() };
        receiveData = null;
        parent.emitter.emit('customEvent' as any, emitData, false, true);
        // 子结点组件成功接收到来自父结点的广播事件
        equal(receiveData, emitData);
    });
});
