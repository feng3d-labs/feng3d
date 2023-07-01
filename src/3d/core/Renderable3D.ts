import { IRenderable } from '../../core/IRenderable';
import { Box3 } from '@feng3d/math';
import { Ray3 } from '@feng3d/math';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { PickingCollisionVO } from '../raycast/rayCast3D';
import { Component3D } from './Component3D';
import { IRayCastable3D } from './IRayCastable3D';

/**
 * 3D可渲染组件
 *
 * 该3D可渲染组件为虚类，无法直接实例化，但如果需要渲染则必须包含3D可渲染组件的子类。
 *
 * 可渲染对象也就意味着拥有判断是否需要渲染的包围盒，因此该组件提供包围盒管理功能。
 *
 * @see https://docs.unity3d.com/cn/current/ScriptReference/Renderer.html
 */
export class Renderable3D extends Component3D implements IRenderable, IRayCastable3D
{
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     */
    readonly renderAtomic = new RenderAtomic();

    protected _localBounds: Box3;
    protected _globalBounds: Box3;

    /**
     * 局部包围盒
     */
    get localBounds()
    {
        if (!this._localBounds)
        {
            this._updateBounds();
        }

        return this._localBounds;
    }

    /**
     * 全局包围盒
     */
    get globalBounds()
    {
        if (!this._globalBounds)
        {
            this._updateGlobalBounds();
        }

        return this._globalBounds;
    }

    /**
     * 与全局空间射线相交
     *
     * @param _globalRay 全局空间射线
     *
     * @return 相交信息
     */
    globalRayIntersection(_globalRay: Ray3): PickingCollisionVO
    {
        throw '请在子类中实现！';
    }

    /**
     * 更新全局边界
     */
    protected _updateGlobalBounds()
    {
        this._globalBounds = this.localBounds.applyMatrixTo(this.entity.globalMatrix);
    }

    /**
     * 处理包围盒变换事件
     */
    protected _onBoundsInvalid()
    {
        this._localBounds = null;
        this._globalBounds = null;

        this.emitter.emit('selfBoundsChanged', this);
    }

    protected _updateBounds() { }
}
