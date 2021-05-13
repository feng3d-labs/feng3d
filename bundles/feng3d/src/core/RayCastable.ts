import { Behaviour } from "../component/Behaviour";
import { RegisterComponent } from "../component/Component";
import { Box3 } from "@feng3d/math";
import { Ray3 } from "@feng3d/math";
import { PickingCollisionVO } from "../pick/Raycaster";

declare module "../component/Component"
{
    export interface ComponentMap { RayCastable: RayCastable; }
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
            this._updateBounds();

        return this._selfLocalBounds;
    }

    /**
     * 自身世界包围盒
     */
    get selfWorldBounds()
    {
        if (!this._selfWorldBounds)
            this._updateWorldBounds();

        return this._selfWorldBounds;
    }

    /**
     * 与世界空间射线相交
     * 
     * @param worldRay 世界空间射线
     * 
     * @return 相交信息
     */
    worldRayIntersection(worldRay: Ray3): PickingCollisionVO
    {
        throw "请在子类中实现！";
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
        this._selfWorldBounds = this.selfLocalBounds.applyMatrixTo(this.node3d.localToWorldMatrix);
    }

    /**
     * 处理包围盒变换事件
     */
    protected _onBoundsInvalid()
    {
        this._selfLocalBounds = null;
        this._selfWorldBounds = null;

        this.emit("selfBoundsChanged", this);
    }

    protected _updateBounds()
    {
        throw "请在子类中实现！";
    }
}
