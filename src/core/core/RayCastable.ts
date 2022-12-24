import { Box3 } from '../../math/geom/Box3';
import { Ray3 } from '../../math/geom/Ray3';
import { Behaviour } from '../component/Behaviour';
import { RegisterComponent } from '../../ecs/Component';
import { PickingCollisionVO } from '../pick/Raycaster';

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
    protected _selfLocalBounds: Box3;
    protected _selfWorldBounds: Box3;

    /**
     * 自身局部包围盒
     */
    get selfLocalBounds()
    {
        if (!this._selfLocalBounds)
        { this._updateBounds(); }

        return this._selfLocalBounds;
    }

    /**
     * 自身世界包围盒
     */
    get selfWorldBounds()
    {
        if (!this._selfWorldBounds)
        { this._updateWorldBounds(); }

        return this._selfWorldBounds;
    }

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

    protected _onScenetransformChanged()
    {
        this._selfWorldBounds = null;
    }

    /**
     * 更新世界边界
     */
    protected _updateWorldBounds()
    {
        this._selfWorldBounds = this.selfLocalBounds.applyMatrixTo(this.object3D.globalMatrix);
    }

    /**
     * 处理包围盒变换事件
     */
    protected _onBoundsInvalid()
    {
        this._selfLocalBounds = null;
        this._selfWorldBounds = null;

        this.emit('selfBoundsChanged', this);
    }

    protected _updateBounds()
    {
        throw '请在子类中实现！';
    }
}
