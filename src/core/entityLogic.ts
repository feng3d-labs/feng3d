import { Entity } from './Entity';

/**
 * Entity 逻辑处理输出。
 *
 * Entity 是纯组件容器，组件的增删直接操作 reactive(entity).components 即可，
 * 不再提供封装函数。entityLogic 仅提供 WeakMap 缓存入口，预留后续扩展。
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
    return {};
}
