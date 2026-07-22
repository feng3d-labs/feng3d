import { Vector3 } from '@feng3d/math';
import { Component3D, Component3DLogic } from '../component/Component';
import { registerLogic, logic as getLogic, batchRun, effect, reactive } from "@feng3d/reactivity";
import { ticker } from '../utils/Ticker';
import { Object3D } from './Object3D';
import './TransformLayout';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        TransformLayout: TransformLayout;
    }
}

/**
 * TransformLayout（纯数据接口）。
 */
export interface TransformLayout extends Component3D
{
    readonly __type__: 'TransformLayout';
    readonly position: Vector3;
    readonly size: Vector3;
    readonly leftTop: Vector3;
    readonly rightBottom: Vector3;
    readonly anchorMin: Vector3;
    readonly anchorMax: Vector3;
    readonly pivot: Vector3;
}

/**
 * 创建 TransformLayout 实例。
 */
export function createTransformLayout(): TransformLayout
{
    return {
        __type__: 'TransformLayout',
        position: new Vector3(),
        size: new Vector3(1, 1, 1),
        leftTop: new Vector3(0, 0, 0),
        rightBottom: new Vector3(0, 0, 0),
        anchorMin: new Vector3(0.5, 0.5, 0.5),
        anchorMax: new Vector3(0.5, 0.5, 0.5),
        pivot: new Vector3(0.5, 0.5, 0.5),
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TransformLayout: TransformLayoutLogic;
    }
}

/**
 * TransformLayout 逻辑处理类。
 *
 * 通过 effect 监听 position/size/anchor/pivot/leftTop/rightBottom 变化，
 * 失效布局并在下一帧重新计算（updateLayout），将结果写入 object3D.position。
 *
 * 变化时 emit sizeChanged / pivotChanged 事件。
 */
export class TransformLayoutLogic extends Component3DLogic
{
    /** 布局是否需要重算 */
    private _layoutInvalid = true;
    /** init 去重标志 */
    private _inited = false;

    /** 绑定的 updateLayout（供 ticker.onframe/offframe 以 this 为上下文调用） */
    private readonly _updateLayoutBound: () => void;

    constructor(layout: TransformLayout)
    {
        super(layout);

        // 绑定方法，保证 ticker 回调中的 this 正确
        this._updateLayoutBound = () => this.updateLayout();
    }

    /** 触发布局重算 */
    invalidateLayout(): void
    {
        this._layoutInvalid = true;
        ticker.onframe(this._updateLayoutBound, this);
    }

    /** updateLayout：依据 position/size/anchor/pivot/leftTop/rightBottom 计算并写入 object3D.position */
    private updateLayout(): void
    {
        if (!this._layoutInvalid) return;

        const layout = this.component as TransformLayout;

        const parent = this.entity && getLogic(this.entity).parent as Object3D | null;
        if (!parent) return;
        const transformLayout = parent.components.find(c => c.__type__ === 'TransformLayout') as TransformLayout;
        if (!transformLayout) return;

        // 中心点基于anchorMin的坐标
        const position = layout.position;
        // 尺寸
        const size = layout.size;
        const leftTop = layout.leftTop;
        const rightBottom = layout.rightBottom;

        // 最小锚点
        const anchorMin = layout.anchorMin.clone();
        // 最大锚点
        const anchorMax = layout.anchorMax.clone();
        const pivot = layout.pivot.clone();

        // 父对象显示区域宽高
        const parentSize = transformLayout.size;
        const parentPivot = transformLayout.pivot;
        // 锚点在父Transform2D中锚定的 leftRightTopBottom 位置。
        const anchorLeftTop = new Vector3(
            anchorMin.x * parentSize.x - parentPivot.x * parentSize.x,
            anchorMin.y * parentSize.y - parentPivot.y * parentSize.y,
            anchorMin.z * parentSize.z - parentPivot.z * parentSize.z,
        );
        const anchorRightBottom = new Vector3(
            anchorMax.x * parentSize.x - parentPivot.x * parentSize.x,
            anchorMax.y * parentSize.y - parentPivot.y * parentSize.y,
            anchorMax.z * parentSize.z - parentPivot.z * parentSize.z,
        );

        if (anchorMin.x === anchorMax.x)
        {
            leftTop.x = (-pivot.x * size.x + position.x) - anchorLeftTop.x;
            rightBottom.x = anchorRightBottom.x - (size.x - pivot.x * size.x + position.x);
        }
        else
        {
            size.x = (anchorRightBottom.x - rightBottom.x) - (anchorLeftTop.x + leftTop.x);
            position.x = leftTop.x + pivot.x * size.x;
        }

        if (anchorMin.y === anchorMax.y)
        {
            leftTop.y = (-pivot.y * size.y + position.y) - anchorLeftTop.y;
            rightBottom.y = anchorRightBottom.y - (size.y - pivot.y * size.y + position.y);
        }
        else
        {
            size.y = (anchorRightBottom.y - rightBottom.y) - (anchorLeftTop.y + leftTop.y);
            position.y = leftTop.y + pivot.y * size.y;
        }

        if (anchorMin.z === anchorMax.z)
        {
            leftTop.z = (-pivot.z * size.z + position.z) - anchorLeftTop.z;
            rightBottom.z = anchorRightBottom.z - (size.z - pivot.z * size.z + position.z);
        }
        else
        {
            size.z = (anchorRightBottom.z - rightBottom.z) - (anchorLeftTop.z + leftTop.z);
            position.z = leftTop.z + pivot.z * size.z;
        }

        // 整体写回 raw.position（缺失字段时整体赋值，避免子字段修改崩溃）
        batchRun(() =>
        {
            reactive(this.entity).position = {
                x: anchorLeftTop.x + position.x,
                y: anchorLeftTop.y + position.y,
                z: anchorLeftTop.z + position.z,
            };
        });
        //
        this._layoutInvalid = false;
        ticker.offframe(this._updateLayoutBound, this);
    }

    private invalidateSize(): void
    {
        this.invalidateLayout();
    }

    private invalidatePivot(): void
    {
        this.invalidateLayout();
    }

    init(object3D?)
    {
        super.init(object3D);
        if (this._inited) return;
        this._inited = true;
        this.invalidateLayout();

        const layout = this.component as TransformLayout;

        // effect 监听 position/anchor 变化
        effect(() =>
        {
            const r_layout = reactive(layout);
            r_layout.position.x; r_layout.position.y; r_layout.position.z;
            r_layout.anchorMin.x; r_layout.anchorMin.y; r_layout.anchorMin.z;
            r_layout.anchorMax.x; r_layout.anchorMax.y; r_layout.anchorMax.z;
            this.invalidateLayout();
        });

        // effect 监听 leftTop/rightBottom/size 变化
        effect(() =>
        {
            const r_layout = reactive(layout);
            r_layout.leftTop.x; r_layout.leftTop.y; r_layout.leftTop.z;
            r_layout.rightBottom.x; r_layout.rightBottom.y; r_layout.rightBottom.z;
            r_layout.size.x; r_layout.size.y; r_layout.size.z;
            this.invalidateSize();
        });

        // effect 监听 pivot 变化
        effect(() =>
        {
            const r_layout = reactive(layout);
            r_layout.pivot.x; r_layout.pivot.y; r_layout.pivot.z;
            this.invalidatePivot();
        });
    }

    beforeRender() { /* u_rect uniform 待通过 bindingResources 注入 */ }

    dispose()
    {
        ticker.offframe(this._updateLayoutBound, this);
    }
}
// 注册到 componentLogic 分发表
registerLogic('TransformLayout', TransformLayoutLogic);
