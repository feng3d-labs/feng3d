import { Vector3Like } from '@feng3d/math';
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
 *
 * 七个布局字段声明为 {@link Vector3Like}（只需 `x/y/z` 的纯数据形状），
 * 字面量 `{ x, y, z }` 可直接声明，Vector3 实例同样满足。
 */
export interface TransformLayout extends Component3D
{
    readonly __type__: 'TransformLayout';
    readonly position: Vector3Like;
    readonly size: Vector3Like;
    readonly leftTop: Vector3Like;
    readonly rightBottom: Vector3Like;
    readonly anchorMin: Vector3Like;
    readonly anchorMax: Vector3Like;
    readonly pivot: Vector3Like;
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
    // 默认值 accessor（字段缺失时每次新建字面量，避免共享引用）
    readonly #r_layout: { position?: Vector3Like; size?: Vector3Like; leftTop?: Vector3Like; rightBottom?: Vector3Like; anchorMin?: Vector3Like; anchorMax?: Vector3Like; pivot?: Vector3Like };
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
        ticker.onframe(() => this.#updateLayout(), undefined);
    }

    /** updateLayout：依据 position/size/anchor/pivot/leftTop/rightBottom 计算并写入 object3D.position */
    #updateLayout = (): void =>
    {
        if (!this.#layoutInvalid) return;

        const r_layout = this.#r_layout;
        const position = () => r_layout.position ?? { x: 0, y: 0, z: 0 };
        const size = () => r_layout.size ?? { x: 1, y: 1, z: 1 };
        const leftTop = () => r_layout.leftTop ?? { x: 0, y: 0, z: 0 };
        const rightBottom = () => r_layout.rightBottom ?? { x: 0, y: 0, z: 0 };
        const anchorMin = () => r_layout.anchorMin ?? { x: 0.5, y: 0.5, z: 0.5 };
        const anchorMax = () => r_layout.anchorMax ?? { x: 0.5, y: 0.5, z: 0.5 };
        const pivot = () => r_layout.pivot ?? { x: 0.5, y: 0.5, z: 0.5 };

        const parent = this.entity && getLogic(this.entity).parent as Object3D | null;
        if (!parent) return;
        const transformLayout = parent.components?.find(c => c.__type__ === 'TransformLayout') as TransformLayout;
        if (!transformLayout) return;

        // 中心点基于anchorMin的坐标（accessor 读取，建立响应式依赖）
        // 阶段 C 收尾：`Vector3Like` 统一为只读后，这里改为**显式浅拷贝出可写副本**
        // （与下面 `_anchorMin` / `_anchorMax` / `_pivot` 同一套路）。顺带修掉了原实现
        // 「就地改响应式数据对象分量」的隐患——原先 `_position.x = ...` 会直接写进 `r_layout.position`。
        const _position = { ...position() };
        // 尺寸
        const _size = { ...size() };
        const _leftTop = { ...leftTop() };
        const _rightBottom = { ...rightBottom() };

        // 最小锚点（字段已放宽为 Vector3Like，没有 clone()：显式浅拷贝出可写副本）
        const _anchorMin = { ...anchorMin() };
        // 最大锚点
        const _anchorMax = { ...anchorMax() };
        const _pivot = { ...pivot() };

        // 父对象显示区域宽高
        const parentSize = transformLayout.size;
        const parentPivot = transformLayout.pivot;
        // 锚点在父Transform2D中锚定的 leftRightTopBottom 位置。
        const anchorLeftTop = {
            x: _anchorMin.x * parentSize.x - parentPivot.x * parentSize.x,
            y: _anchorMin.y * parentSize.y - parentPivot.y * parentSize.y,
            z: _anchorMin.z * parentSize.z - parentPivot.z * parentSize.z,
        };
        const anchorRightBottom = {
            x: _anchorMax.x * parentSize.x - parentPivot.x * parentSize.x,
            y: _anchorMax.y * parentSize.y - parentPivot.y * parentSize.y,
            z: _anchorMax.z * parentSize.z - parentPivot.z * parentSize.z,
        };

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
        ticker.offframe(this.#updateLayout, undefined);
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
            const p = r_layout.position ?? { x: 0, y: 0, z: 0 }; p.x; p.y; p.z;
            const am = r_layout.anchorMin ?? { x: 0.5, y: 0.5, z: 0.5 }; am.x; am.y; am.z;
            const ax = r_layout.anchorMax ?? { x: 0.5, y: 0.5, z: 0.5 }; ax.x; ax.y; ax.z;
            this.invalidateLayout();
        });

        // @过渡 effect：布局结果可 computed 化（随 TransformLayout 重构迁移）
        // effect 监听 leftTop/rightBottom/size 变化
        effect(() =>
        {
            const lt = r_layout.leftTop ?? { x: 0, y: 0, z: 0 }; lt.x; lt.y; lt.z;
            const rb = r_layout.rightBottom ?? { x: 0, y: 0, z: 0 }; rb.x; rb.y; rb.z;
            const s = r_layout.size ?? { x: 1, y: 1, z: 1 }; s.x; s.y; s.z;
            this.invalidateLayout();
        });

        // @过渡 effect：布局结果可 computed 化（随 TransformLayout 重构迁移）
        // effect 监听 pivot 变化
        effect(() =>
        {
            const pv = r_layout.pivot ?? { x: 0.5, y: 0.5, z: 0.5 }; pv.x; pv.y; pv.z;
            this.invalidateLayout();
        });
    }

    beforeRender(_renderObject: never): void { /* u_rect uniform 待通过 bindingResources 注入 */ }

    dispose(): void
    {
        ticker.offframe(this.#updateLayout, undefined);
    }
}
// 注册到 logic 分发表
registerLogic('TransformLayout', TransformLayoutLogic as unknown as new (data: TransformLayout) => TransformLayoutLogic);
