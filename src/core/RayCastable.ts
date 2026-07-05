import { Ray3 } from '@feng3d/math';
import { Behaviour } from '../component/Behaviour';
;
import { PickingCollisionVO } from '../pick/Raycaster';

/**
 * 可射线捕获（纯数据基类）。
 *
 * 自身包围盒（selfLocalBounds / selfWorldBounds）与世界射线相交检测由
 * 子类 logic（如 renderableLogic）提供。
 */
export class RayCastable extends Behaviour
{
    readonly __type__: string = 'RayCastable';

    /**
     * 与世界空间射线相交。
     *
     * @param _worldRay 世界空间射线
     * @return 相交信息（由子类 logic 实现）
     */
    worldRayIntersection(_worldRay: Ray3): PickingCollisionVO
    {
        throw '请在子类中实现！';
    }
}
