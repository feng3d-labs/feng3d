import { effect, reactive, toRaw } from '@feng3d/reactivity';
import { Component } from '../component/Component';
import { initComponent } from '../component/componentLogic';
import { Entity } from './Entity';
import type { Object3D } from './Object3D';

/**
 * Entity 逻辑处理输出。
 *
 * Entity 是纯组件容器，组件的增删直接操作 reactive(entity).components。
 * entityLogic 通过 effect 监听 components 变化，对新组件自动执行 initComponent
 * （注入 object3D 并调用 componentLogic(component).init()）。
 */
export interface EntityLogic
{
}

const logicMap = new WeakMap<Entity, EntityLogic>();

/**
 * 获取 Entity 的逻辑处理输出。
 *
 * 使用 WeakMap 缓存，同一 Entity 始终返回同一组输出。
 */
export function entityLogic(entity: Entity): EntityLogic
{
    let logic = logicMap.get(entity);
    if (logic) return logic;

    logic = createEntityLogic(entity);
    logicMap.set(entity, logic);

    return logic;
}

function createEntityLogic(entity: Entity): EntityLogic
{
    // 监听 components 变化，自动对新组件执行 initComponent。
    // effect 在首次执行时同步运行，后续 components 变化时由响应式系统同步触发重算。
    effect(() =>
    {
        const r_components = reactive(entity).components as Component[];
        for (const r_component of r_components)
        {
            // 用 toRaw 获取原始组件，确保 EventEmitter 内部映射与 logicMap 缓存正确
            const rawComponent = toRaw(r_component);
            initComponent(rawComponent, entity as Object3D);
        }
    });

    return {};
}
