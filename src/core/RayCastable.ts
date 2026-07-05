import { Behaviour, createBehaviour } from '../component/Behaviour';

/**
 * 可射线捕获（纯数据接口）。
 *
 * 自身包围盒与世界射线相交检测由子类 logic（如 renderableLogic）提供。
 */
export interface RayCastable extends Behaviour
{
}

/**
 * 创建 RayCastable 实例。
 */
export function createRayCastable(): RayCastable
{
    return { ...createBehaviour(), __type__: 'RayCastable' };
}
