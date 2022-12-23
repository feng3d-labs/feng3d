import { Box3, Vector3 } from '@feng3d/math';
import { Component } from '../component/Component';
import { Object3D } from './Object3D';

declare global
{
    export interface MixinsObject3DEventMap
    {
        /**
         * 获取自身包围盒
         */
        getSelfBounds: { bounds: Box3[] };

        /**
         * 自身包围盒发生变化
         */
        selfBoundsChanged: Component;
    }
}

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
        object3D.on('selfBoundsChanged', this._invalidateSelfLocalBounds, this);
        object3D.on('globalMatrixChanged', this._invalidateSelfWorldBounds, this);
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

        // 获取对象上的包围盒
        const data: { bounds: Box3[]; } = { bounds: [] };
        this._object3D.emit('getSelfBounds', data);

        data.bounds.forEach((b) =>
        {
            bounds.union(b);
        });
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
        this._selfWorldBounds.copy(this.selfLocalBounds).applyMatrix(this._object3D.globalMatrix);
    }

    /**
     * 更新世界包围盒
     */
    protected _updateWorldBounds()
    {
        this._worldBounds.copy(this.selfWorldBounds);

        // 获取子对象的世界包围盒与自身世界包围盒进行合并
        this._object3D.children.forEach((element: Object3D) =>
        {
            this._worldBounds.union(element.boundingBox.worldBounds);
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
        const parent = this._object3D.parent;
        if (!parent) return;
        parent.boundingBox._invalidateWorldBounds();
    }
}
