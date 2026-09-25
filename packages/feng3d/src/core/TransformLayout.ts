import { Vector3 } from '@feng3d/math';
import { Component3D, ComponentLogicBase } from '../component/Component';
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
 * TransformLayout 逻辑类。
 *
 * 通过 effect 监听 position/size/anchor/pivot/leftTop/rightBottom 变化，
 * 失效布局并在下一帧重新计算（updateLayout），将结果写入 object3D.position。
 */
export class TransformLayoutLogic extends ComponentLogicBase
{
    // 默认值 accessor（Vector3 字段缺失时每次新建，避免共享引用）
    readonly #r_layout: { position?: Vector3; size?: Vector3; leftTop?: Vector3; rightBottom?: Vector3; anchorMin?: Vector3; anchorMax?: Vector3; pivot?: Vector3 };
    /** 布局是否需要重算 */
    #layoutInvalid = true;
    /** init 去重标志 */
    #inited = false;

    protected constructor(data: TransformLayout)
    {
        super(data);
        this.#r_layout = reactive(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: TransformLayout): TransformLayoutLogic
    {
        return new TransformLayoutLogic(data);
    }

    get entity(): Object3D | null
    {
        return this._entity as Object3D | null;
    }

    /** 触发布局重算 */
    invalidateLayout(): void
    {
        this.#layoutInvalid = true;
        ticker.onframe(() => this.#updateLayout(), null);
    }

    /** updateLayout：依据 position/size/anchor/pivot/leftTop/rightBottom 计算并写入 object3D.position */
    #updateLayout = (): void =>
    {
        if (!this.#layoutInvalid) return;

        const r_layout = this.#r_layout;
        const position = () => r_layout.position ?? new Vector3();
        const size = () => r_layout.size ?? new Vector3(1, 1, 1);
        const leftTop = () => r_layout.leftTop ?? new Vector3(0, 0, 0);
        const rightBottom = () => r_layout.rightBottom ?? new Vector3(0, 0, 0);
        const anchorMin = () => r_layout.anchorMin ?? new Vector3(0.5, 0.5, 0.5);
        const anchorMax = () => r_layout.anchorMax ?? new Vector3(0.5, 0.5, 0.5);
        const pivot = () => r_layout.pivot ?? new Vector3(0.5, 0.5, 0.5);

        const parent = this.entity && getLogic(this.entity).parent as Object3D | null;
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
            reactive(this.entity as Object3D).position = {
                x: anchorLeftTop.x + _position.x,
                y: anchorLeftTop.y + _position.y,
                z: anchorLeftTop.z + _position.z,
            };
        });
        //
        this.#layoutInvalid = false;
        ticker.offframe(this.#updateLayout, null);
    };

    init(object3D?: Object3D): void
    {
        super.init(object3D);
        if (this.#inited) return;
        this.#inited = true;
        this.invalidateLayout();

        const r_layout = this.#r_layout;

        // @过渡 effect：布局结果可 computed 化（随 TransformLayout 重构迁移）
        // effect 监听 position/anchor 变化
        effect(() =>
        {
            const p = r_layout.position ?? new Vector3(); p.x; p.y; p.z;
            const am = r_layout.anchorMin ?? new Vector3(0.5, 0.5, 0.5); am.x; am.y; am.z;
            const ax = r_layout.anchorMax ?? new Vector3(0.5, 0.5, 0.5); ax.x; ax.y; ax.z;
            this.invalidateLayout();
        });

        // @过渡 effect：布局结果可 computed 化（随 TransformLayout 重构迁移）
        // effect 监听 leftTop/rightBottom/size 变化
        effect(() =>
        {
            const lt = r_layout.leftTop ?? new Vector3(0, 0, 0); lt.x; lt.y; lt.z;
            const rb = r_layout.rightBottom ?? new Vector3(0, 0, 0); rb.x; rb.y; rb.z;
            const s = r_layout.size ?? new Vector3(1, 1, 1); s.x; s.y; s.z;
            this.invalidateLayout();
        });

        // @过渡 effect：布局结果可 computed 化（随 TransformLayout 重构迁移）
        // effect 监听 pivot 变化
        effect(() =>
        {
            const pv = r_layout.pivot ?? new Vector3(0.5, 0.5, 0.5); pv.x; pv.y; pv.z;
            this.invalidateLayout();
        });
    }

    beforeRender(_renderObject: never): void { /* u_rect uniform 待通过 bindingResources 注入 */ }

    dispose(): void
    {
        ticker.offframe(this.#updateLayout, null);
    }
}
// 注册到 logic 分发表
registerLogic('TransformLayout', TransformLayoutLogic as unknown as new (data: TransformLayout) => TransformLayoutLogic);
