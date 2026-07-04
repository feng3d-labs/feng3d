import { Box3, Ray3 } from '@feng3d/math';
import { computed, reactive } from '@feng3d/reactivity';
import { Behaviour } from '../component/Behaviour';
import { RegisterComponent } from '../component/Component';
import { PickingCollisionVO } from '../pick/Raycaster';
import { transformLogic } from './transformLogic';

declare global
{
    export interface MixinsComponentMap
    {
        RayCastable: RayCastable;
    }
}

/**
 * 可射线捕获
 */
@RegisterComponent()
export class RayCastable extends Behaviour
{
    /**
     * 自身局部包围盒
     */
    readonly selfLocalBounds = computed(() => new Box3());

    /**
     * 自身世界包围盒
     */
    readonly selfWorldBounds = computed(() =>
    {
        const r_this = reactive(this);
        r_this.selfLocalBounds;

        //
        const selfWorldBounds = this.selfLocalBounds.value.clone().applyMatrixTo(transformLogic(this._object3D).local2world.value);

        return selfWorldBounds;
    });

    /**
     * 与世界空间射线相交
     *
     * @param _worldRay 世界空间射线
     *
     * @return 相交信息
     */
    worldRayIntersection(_worldRay: Ray3): PickingCollisionVO
    {
        throw '请在子类中实现！';
    }
}
