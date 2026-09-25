import { isRenderable } from "../component/Component";
import { Box3, Vector3 } from '@feng3d/math';
import { effect } from '@feng3d/reactivity';
import { Object3D } from "./Object3D";
import { logic } from '@feng3d/reactivity';
import type { RenderableLogic } from './Renderable';

/**
 * 轴对称包围盒
 *
 * 用于优化计算射线碰撞检测以及视锥剔除等。
 */
export class BoundingBox
{
    private _object3D: Object3D;

    protected _selfLocalBounds = new Box3();
    protected _selfWorldBounds = new Box3();
    protected _worldBounds = new Box3();

    protected _selfBoundsInvalid = true;
    protected _selfWorldBoundsInvalid = true;
    protected _worldBoundsInvalid = true;

    constructor(object3D: Object3D)
    {
        this._object3D = object3D;
        // @过渡 effect：selfWorldBounds 可 computed 化（随矩阵链重构迁移，见设计 6 章）
        // 通过响应式 effect 监听 local2world 变化，失效自身世界包围盒
        effect(() =>
        {
            logic(object3D).local2world;
            this._invalidateSelfWorldBounds();
        });
    }

    /**
     * 自身局部包围盒通常有Renderable组件提供
     */
    get selfLocalBounds()
    {
        if (this._selfBoundsInvalid)
        {
            this._updateSelfBounds();
            this._selfBoundsInvalid = false;
        }

        return this._selfLocalBounds;
    }

    /**
     * 自身世界空间的包围盒
     */
    get selfWorldBounds()
    {
        if (this._selfWorldBoundsInvalid)
        {
            this._updateSelfWorldBounds();
            this._selfWorldBoundsInvalid = false;
        }

        return this._selfWorldBounds;
    }

    /**
     * 世界包围盒
     */
    get worldBounds()
    {
        if (this._worldBoundsInvalid)
        {
            this._updateWorldBounds();
            this._worldBoundsInvalid = false;
        }

        return this._worldBounds;
    }

    /**
     * 更新自身包围盒
     *
     * 自身包围盒通常有Renderable组件提供
     */
    protected _updateSelfBounds()
    {
        const bounds = this._selfLocalBounds.empty();

        // 从组件上获取包围盒（Renderable 系组件的 selfLocalBounds 由  提供）
        const components = this._object3D.components;
        for (let i = 0; i < components.length; i++)
        {
            const component = components[i];
            if (isRenderable(component))
            {
                const b = (logic(component) as unknown as RenderableLogic).selfLocalBounds;
                if (b)
                {
                    const value = b.value;
                    if (value) bounds.union(value);
                }
            }
        }

        if (bounds.isEmpty())
        {
            bounds.fromPoints([new Vector3()]);
        }
    }

    /**
     * 更新自身世界包围盒
     */
    protected _updateSelfWorldBounds()
    {
        this._selfWorldBounds.copy(this.selfLocalBounds).applyMatrix(logic(this._object3D).local2world);
    }

    /**
     * 更新世界包围盒
     */
    protected _updateWorldBounds()
    {
        this._worldBounds.copy(this.selfWorldBounds);

        // 获取子对象的世界包围盒与自身世界包围盒进行合并
        this._object3D.children.forEach((element) =>
        {
            this._worldBounds.union(logic(element as Object3D).boundingBox.worldBounds);
        });
    }

    /**
     * 使自身包围盒失效
     */
    protected _invalidateSelfLocalBounds()
    {
        if (this._selfBoundsInvalid) return;

        this._selfBoundsInvalid = true;
        this._invalidateSelfWorldBounds();
    }

    /**
     * 使自身世界包围盒失效
     */
    protected _invalidateSelfWorldBounds()
    {
        if (this._selfWorldBoundsInvalid) return;

        this._selfWorldBoundsInvalid = true;
        this._invalidateWorldBounds();
    }

    /**
     * 使世界包围盒失效
     */
    protected _invalidateWorldBounds()
    {
        if (this._worldBoundsInvalid) return;

        this._worldBoundsInvalid = true;

        // 世界包围盒失效会影响父对象世界包围盒失效
        const parent = logic(this._object3D).parent;
        if (!parent) return;
        logic(parent as Object3D).boundingBox._invalidateWorldBounds();
    }
}
