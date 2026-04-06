import { Component } from '../../ecs/Component';
import { Box3 } from '../../math/geom/Box3';
import { Vector3 } from '../../math/geom/Vector3';
import { Node3D } from './Node3D';

declare module './Node3D'
{
    interface Node3DEventMap
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
export class BoundingBox3D
{
    private _object3D: Node3D;

    protected _selfLocalBounds = new Box3();
    protected _selfGlobalBounds = new Box3();
    protected _globalBounds = new Box3();

    protected _selfBoundsInvalid = true;
    protected _selfGlobalBoundsInvalid = true;
    protected _globalBoundsInvalid = true;

    constructor(node3d: Node3D)
    {
        this._object3D = node3d;
        node3d.emitter.on('selfBoundsChanged', this._invalidateSelfLocalBounds, this);
        node3d.emitter.on('globalMatrixChanged', this._invalidateSelfGlobalBounds, this);
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
     * 自身全局空间的包围盒
     */
    get selfGlobalBounds()
    {
        if (this._selfGlobalBoundsInvalid)
        {
            this._updateSelfGlobalBounds();
            this._selfGlobalBoundsInvalid = false;
        }

        return this._selfGlobalBounds;
    }

    /**
     * 全局包围盒
     */
    get globalBounds()
    {
        if (this._globalBoundsInvalid)
        {
            this._updateGlobalBounds();
            this._globalBoundsInvalid = false;
        }

        return this._globalBounds;
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
        this._object3D.emitter.emit('getSelfBounds', data);

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
     * 更新自身全局包围盒
     */
    protected _updateSelfGlobalBounds()
    {
        this._selfGlobalBounds.copy(this.selfLocalBounds).applyMatrix(this._object3D.globalMatrix);
    }

    /**
     * 更新全局包围盒
     */
    protected _updateGlobalBounds()
    {
        this._globalBounds.copy(this.selfGlobalBounds);

        // 获取子对象的全局包围盒与自身全局包围盒进行合并
        this._object3D.children.forEach((element: Node3D) =>
        {
            this._globalBounds.union(element.boundingBox.globalBounds);
        });
    }

    /**
     * 使自身包围盒失效
     */
    protected _invalidateSelfLocalBounds()
    {
        if (this._selfBoundsInvalid) return;

        this._selfBoundsInvalid = true;
        this._invalidateSelfGlobalBounds();
    }

    /**
     * 使自身全局包围盒失效
     */
    protected _invalidateSelfGlobalBounds()
    {
        if (this._selfGlobalBoundsInvalid) return;

        this._selfGlobalBoundsInvalid = true;
        this._invalidateGlobalBounds();
    }

    /**
     * 使全局包围盒失效
     */
    protected _invalidateGlobalBounds()
    {
        if (this._globalBoundsInvalid) return;

        this._globalBoundsInvalid = true;

        // 全局包围盒失效会影响父对象全局包围盒失效
        const parent = this._object3D.parent;
        if (!parent) return;
        parent.boundingBox._invalidateGlobalBounds();
    }
}
