import { Box3 } from '../../math/geom/Box3';
import { Ray3 } from '../../math/geom/Ray3';
import { gPartial } from '../../polyfill/Types';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { serialization } from '../../serialization/Serialization';
import { Behaviour } from '../component/Behaviour';
import { PickingCollisionVO } from '../pick/Raycaster';

declare global
{
    export interface MixinsComponentMap { Renderable: Renderer; }
}

/**
 * 渲染器组件
 * 
 * 该渲染器组件为虚类，无法直接实例化，但如果需要渲染则必须包含渲染器组件的子类。
 * 
 * 可渲染对象也就意味着拥有判断是否需要渲染的包围盒，因此该组件提供包围盒管理功能。
 *
 * @see https://docs.unity3d.com/cn/current/ScriptReference/Renderer.html
 */
export class Renderer extends Behaviour
{
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     */
    readonly renderAtomic = new RenderAtomic();

    protected _selfLocalBounds: Box3;
    protected _selfWorldBounds: Box3;

    /**
     * 自身局部包围盒
     */
    get selfLocalBounds()
    {
        if (!this._selfLocalBounds)
        {
            this._updateBounds();
        }

        return this._selfLocalBounds;
    }

    /**
     * 自身世界包围盒
     */
    get selfWorldBounds()
    {
        if (!this._selfWorldBounds)
        {
            this._updateWorldBounds();
        }

        return this._selfWorldBounds;
    }

    constructor(param?: gPartial<Renderer>)
    {
        super();
        serialization.setValue(this, param);
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
        this._selfWorldBounds = this.selfLocalBounds.applyMatrixTo(this.entity.globalMatrix);
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

    protected _updateBounds() { }
}
