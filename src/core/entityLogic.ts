import { effect, reactive } from '@feng3d/reactivity';
import { Component } from '../component/Component';
import { Entity } from './Entity';

/**
 * Entity 逻辑处理输出。
 *
 * Entity 是纯组件容器，组件的增删直接操作 reactive(entity).components 即可。
 * entityLogic 通过 effect 监听 components 变化，对新组件执行 setObject3D + init。
 */
export interface EntityLogic
{
}

const logicMap = new WeakMap<Entity, EntityLogic>();
const initialized = new WeakSet<Component>();

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
    // 拦截 components 数组的 push：新组件自动 setObject3D + init
    const r_components = reactive(entity).components as any;
    const origPush = r_components.push.bind(r_components);
    r_components.push = function (...items: Component[])
    {
        for (const component of items)
        {
            if (!initialized.has(component))
            {
                initialized.add(component);
                component.setObject3D(entity as any);
                component.init();
            }
        }

        return origPush(...items);
    };

    return {};
}
