import { Vector3 } from '@feng3d/math';
import { Component3D, Component3DLogic, componentLogic } from '../component/Component';
import { registerLogic, logic as getLogic, batchRun, effect, reactive } from "@feng3d/reactivity";
import { ticker } from '../utils/Ticker';
import { Object3D } from './Object3D';

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

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TransformLayout: TransformLayoutLogic;
    }
}

/**
 * TransformLayout 逻辑处理接口。
 *
 * 通过 effect 监听 position/size/anchor/pivot/leftTop/rightBottom 变化，
 * 失效布局并在下一帧重新计算（updateLayout），将结果写入 object3D.position。
 *
 * 变化时 emit sizeChanged / pivotChanged 事件。
 */
export interface TransformLayoutLogic extends Component3DLogic
{
    /** 触发布局重算 */
    invalidateLayout(): void;
}

/**
 * 创建 TransformLayoutLogic 实例（工厂函数，组合 componentLogic 基础行为）。
 */
export function transformLayoutLogic(layout: TransformLayout): TransformLayoutLogic
{
    const base = componentLogic(layout);

    // 默认值 accessor（Vector3 字段缺失时每次新建，避免共享引用）
    const r_layout = reactive(layout);
    const position = () => r_layout.position ?? new Vector3();
    const size = () => r_layout.size ?? new Vector3(1, 1, 1);
    const leftTop = () => r_layout.leftTop ?? new Vector3(0, 0, 0);
    const rightBottom = () => r_layout.rightBottom ?? new Vector3(0, 0, 0);
    const anchorMin = () => r_layout.anchorMin ?? new Vector3(0.5, 0.5, 0.5);
    const anchorMax = () => r_layout.anchorMax ?? new Vector3(0.5, 0.5, 0.5);
    const pivot = () => r_layout.pivot ?? new Vector3(0.5, 0.5, 0.5);

    // 布局是否需要重算
    let _layoutInvalid = true;
    // init 去重标志
    let _inited = false;

    /** updateLayout：依据 position/size/anchor/pivot/leftTop/rightBottom 计算并写入 object3D.position */
    const updateLayout = () =>
    {
        if (!_layoutInvalid) return;

        const parent = base.entity && getLogic(base.entity).parent as Object3D | null;
        if (!parent) return;
        const transformLayout = parent.components.find(c => c.__type__ === 'TransformLayout') as TransformLayout;
        if (!transformLayout) return;

        // 中心点基于anchorMin的坐标（accessor 读取，建立响应式依赖）
        const _position = position();
        // 尺寸
        const _size = size();
        const _leftTop = leftTop();
        const _rightBottom = rightBottom();

        // 最小锚点
        const _anchorMin = anchorMin().clone();
        // 最大锚点
        const _anchorMax = anchorMax().clone();
        const _pivot = pivot().clone();

        // 父对象显示区域宽高
        const parentSize = transformLayout.size;
        const parentPivot = transformLayout.pivot;
        // 锚点在父Transform2D中锚定的 leftRightTopBottom 位置。
        const anchorLeftTop = new Vector3(
            _anchorMin.x * parentSize.x - parentPivot.x * parentSize.x,
            _anchorMin.y * parentSize.y - parentPivot.y * parentSize.y,
            _anchorMin.z * parentSize.z - parentPivot.z * parentSize.z,
        );
        const anchorRightBottom = new Vector3(
            _anchorMax.x * parentSize.x - parentPivot.x * parentSize.x,
            _anchorMax.y * parentSize.y - parentPivot.y * parentSize.y,
            _anchorMax.z * parentSize.z - parentPivot.z * parentSize.z,
        );

        if (_anchorMin.x === _anchorMax.x)
        {
            _leftTop.x = (-_pivot.x * _size.x + _position.x) - anchorLeftTop.x;
            _rightBottom.x = anchorRightBottom.x - (_size.x - _pivot.x * _size.x + _position.x);
        }
        else
        {
            _size.x = (anchorRightBottom.x - _rightBottom.x) - (anchorLeftTop.x + _leftTop.x);
            _position.x = _leftTop.x + _pivot.x * _size.x;
        }

        if (_anchorMin.y === _anchorMax.y)
        {
            _leftTop.y = (-_pivot.y * _size.y + _position.y) - anchorLeftTop.y;
            _rightBottom.y = anchorRightBottom.y - (_size.y - _pivot.y * _size.y + _position.y);
        }
        else
        {
            _size.y = (anchorRightBottom.y - _rightBottom.y) - (anchorLeftTop.y + _leftTop.y);
            _position.y = _leftTop.y + _pivot.y * _size.y;
        }

        if (_anchorMin.z === _anchorMax.z)
        {
            _leftTop.z = (-_pivot.z * _size.z + _position.z) - anchorLeftTop.z;
            _rightBottom.z = anchorRightBottom.z - (_size.z - _pivot.z * _size.z + _position.z);
        }
        else
        {
            _size.z = (anchorRightBottom.z - _rightBottom.z) - (anchorLeftTop.z + _leftTop.z);
            _position.z = _leftTop.z + _pivot.z * _size.z;
        }

        // 整体写回 raw.position（缺失字段时整体赋值，避免子字段修改崩溃）
        batchRun(() =>
        {
            reactive(base.entity as Object3D).position = {
                x: anchorLeftTop.x + _position.x,
                y: anchorLeftTop.y + _position.y,
                z: anchorLeftTop.z + _position.z,
            };
        });
        //
        _layoutInvalid = false;
        ticker.offframe(updateLayout, null);
    };

    const invalidateSize = () =>
    {
        invalidateLayout();
    };

    const invalidatePivot = () =>
    {
        invalidateLayout();
    };

    /** 触发布局重算 */
    const invalidateLayout = (): void =>
    {
        _layoutInvalid = true;
        ticker.onframe(updateLayout, null);
    };

    // 捕获基类方法，避免覆盖后再调用 base.init 导致递归
    const baseInit = base.init;

    return Object.assign(base, {
        invalidateLayout,
        init(object3D?: Object3D)
        {
            baseInit(object3D);
            if (_inited) return;
            _inited = true;
            invalidateLayout();

            // effect 监听 position/anchor 变化
            effect(() =>
            {
                const p = position(); p.x; p.y; p.z;
                const am = anchorMin(); am.x; am.y; am.z;
                const ax = anchorMax(); ax.x; ax.y; ax.z;
                invalidateLayout();
            });

            // effect 监听 leftTop/rightBottom/size 变化
            effect(() =>
            {
                const lt = leftTop(); lt.x; lt.y; lt.z;
                const rb = rightBottom(); rb.x; rb.y; rb.z;
                const s = size(); s.x; s.y; s.z;
                invalidateSize();
            });

            // effect 监听 pivot 变化
            effect(() =>
            {
                const pv = pivot(); pv.x; pv.y; pv.z;
                invalidatePivot();
            });
        },
        beforeRender() { /* u_rect uniform 待通过 bindingResources 注入 */ },
        dispose()
        {
            ticker.offframe(updateLayout, null);
        },
    }) as unknown as TransformLayoutLogic;
}
// 注册到 componentLogic 分发表
registerLogic('TransformLayout', transformLayoutLogic);
