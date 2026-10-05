import { Component3D, ComponentLogicBase, Object3D, registerComponentType, TransformLayout } from 'feng3d';
import { computed, effect, logic as getLogic, reactive, ref, registerLogic } from '@feng3d/reactivity';
import type { Reactive } from '@feng3d/reactivity';
import { Vector2Like, Vector4, Vector4Like } from '@feng3d/math';
import type { RenderObject } from '@feng3d/webgpu';
import { uiUniforms } from './UIMaterial';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Transform2D: Transform2D;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Transform2D: Transform2DLogic;
    }
}

/**
 * 2D变换（纯数据接口）。
 *
 * 提供比 TransformLayout 更贴近 2D 元素语义的一组字段（位置/尺寸/锚点/中心点/边距/旋转/缩放），
 * 行为全部由 {@link Transform2DLogic} 提供：
 *
 * - 字段与同对象的 {@link TransformLayout} 组件**双向镜像**（复刻迁移前 `watcher.bind` 的
 *   变化驱动语义）：改 Transform2D 的字段会写进布局组件，布局组件的字段被外部改动时也会回写；
 * - `rotation` / `scale` 与宿主 Object3D 的 `rotation.z` / `scale.x` / `scale.y` 双向镜像
 *   （迁移前绑的是已删除的 `Transform` 组件，主仓的变换数据直接挂在 Object3D 上）；
 * - 只读派生值 `rect` 由布局组件的 `pivot` / `size` 算出，渲染前写入 `u_rect` uniform。
 *
 * 字段一律 `readonly`（根规范 §8.5）：修改经 `reactive(transform2D).field = value` 写入。
 */
export interface Transform2D extends Component3D
{
    readonly __type__: 'Transform2D';

    /**
     * 位移（缺失时按 `{ x: 0, y: 0 }` 处理）。
     *
     * 当 `anchorMin.x == anchorMax.x` 时对 `position.x` 赋值生效，`y` 同理，否则赋值无效、自动被覆盖。
     */
    readonly position?: Vector2Like;

    /**
     * 尺寸，宽高（缺失时按 `{ x: 1, y: 1 }` 处理）。
     *
     * 宽度不会影响到缩放值。当 `anchorMin.x == anchorMax.x` 时对 `size.x` 赋值生效，`y` 同理。
     */
    readonly size?: Vector2Like;

    /**
     * 与最小最大锚点形成的边框的 left、right、top、bottom 距离（缺失时按全 0 处理）。
     *
     * `x` = left、`y` = right、`z` = top、`w` = bottom——分别镜像到布局组件的
     * `leftTop.x` / `rightBottom.x` / `leftTop.y` / `rightBottom.y`（与迁移前的绑定一一对应）。
     */
    readonly layout?: Vector4Like;

    /**
     * 最小锚点，父 Transform2D 中左上角锚定的规范化位置（缺失时按 `{ x: 0.5, y: 0.5 }` 处理）。
     */
    readonly anchorMin?: Vector2Like;

    /**
     * 最大锚点，父 Transform2D 中右下角锚定的规范化位置（缺失时按 `{ x: 0.5, y: 0.5 }` 处理）。
     */
    readonly anchorMax?: Vector2Like;

    /**
     * 旋转中心（规范化位置，缺失时按 `{ x: 0.5, y: 0.5 }` 处理）。
     */
    readonly pivot?: Vector2Like;

    /**
     * 旋转（弧度，缺失时按 0 处理）。镜像到宿主 Object3D 的 `rotation.z`。
     */
    readonly rotation?: number;

    /**
     * 缩放（缺失时按 `{ x: 1, y: 1 }` 处理）。`x` / `y` 镜像到宿主 Object3D 的 `scale.x` / `scale.y`。
     */
    readonly scale?: Vector2Like;
}

/**
 * Transform2D 逻辑类。
 *
 * 与 {@link TransformLayoutLogic} 的分工：本类只负责 2D 字段的语义与镜像，
 * 「锚点 → 宿主对象 position」的布局计算仍由 TransformLayoutLogic 承担。
 */
export class Transform2DLogic extends ComponentLogicBase
{
    /** 响应式代理（字段镜像用；不对外暴露，字段只读——规范 §8.1 / §8.5） */
    readonly #r_data: Reactive<Transform2D>;

    /**
     * 依赖组件：布局（init 时解析，缺失则创建）。
     *
     * 用 `ref` 持有而不是普通字段：`rect` 的 computed 与两个镜像 effect 都要读它，
     * 普通字段的变化不会让 computed 失效——若在 init 之前读过 `rect`，
     * 缓存里就会留下「没有布局组件」的结果（init 之后也不会重算）。
     */
    readonly #layoutRef = ref<TransformLayout | null>(null);

    /** init 去重标志 */
    #inited = false;

    /**
     * 各字段「上次已同步的值」（JSON 文本）。
     *
     * 复刻迁移前 `watcher.bind` 的**变化驱动**语义：只在某一侧字段**真的变化**时才写另一侧，
     * 首次读到字段只登记不写。这样两侧各自的初始值不会被对方覆盖，
     * 也不会出现「A 写 B、B 写 A」的自激循环（写入使两侧相等后即自止）。
     */
    readonly #synced = new Map<string, string>();

    /**
     * 2D 描述区域：`x` = left、`y` = top、`z` = width、`w` = height。
     *
     * 由布局组件的 `pivot` / `size` 派生（迁移前同样是实时读布局组件算出来的，
     * 区别只是不再复用可变实例，改为 computed 缓存）。
     */
    readonly #rect = computed<Vector4>(() =>
    {
        const layout = this.#layoutRef.value;
        const size = layout?.size ?? { x: 1, y: 1, z: 1 };
        const pivot = layout?.pivot ?? { x: 0.5, y: 0.5, z: 0.5 };
        // 读各分量建立响应式依赖（布局组件字段变化时本 computed 失效重算）
        const x = -pivot.x * size.x;
        const y = -pivot.y * size.y;
        const width = size.x;
        const height = size.y;

        return { __type__: 'Vector4', x, y, z: width, w: height };
    });

    protected constructor(data: Transform2D)
    {
        super(data);
        this.#r_data = reactive(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: Transform2D): Transform2DLogic
    {
        return new Transform2DLogic(data);
    }

    /** 所属 Object3D（由 init 注入，只读） */
    get entity(): Object3D | null
    {
        return this._entity as Object3D | null;
    }

    /** 布局组件（与 Transform2D 字段互相镜像；未 init 时为 null） */
    get transformLayout(): TransformLayout | null
    {
        return this.#layoutRef.value;
    }

    /** 2D 描述区域（`x` = left、`y` = top、`z` = width、`w` = height） */
    get rect(): Vector4
    {
        return this.#rect.value;
    }

    override init(object3D?: Object3D): void
    {
        super.init(object3D);
        if (this.#inited) return;
        this.#inited = true;

        const entity = this.entity;
        if (!entity) return;

        // 处理依赖组件：布局组件（缺失时就地创建并挂到宿主对象上，与原实现一致）。
        //
        // ⚠️ 这里**直接查数据**而不是 `logic(entity).getComponent(...)`：本方法由宿主 logic
        // 的组件初始化 effect 调用，此刻宿主 Object3DLogic 仍在构造中，`logic(entity)` 拿到的是
        // 「构造中」占位对象（没有 getComponent）。数据层查找与 `TransformLayoutLogic` 内部一致。
        const r_entity = reactive(entity);
        // strictNullChecks：`Object3D.components` 是可选的。先把缺失的列表建立并**挂回宿主**
        // （原先只写了 `?? []` 到局部变量，随后却 push 到 `r_entity.components` —— 一旦真的缺失，
        // 局部数组会挂不上、`push` 还会以 TypeError 炸开）。EntityLogic 构造已 pre-fill，
        // 这里兜住「未经 logic 构造就被 init」的路径。
        if (!r_entity.components) r_entity.components = [];
        const components = r_entity.components;
        let transformLayout = components.find(
            (component) => (component as { __type__?: string }).__type__ === 'TransformLayout',
        ) as TransformLayout | undefined;
        if (!transformLayout)
        {
            transformLayout = {
                __type__: 'TransformLayout',
                position: { x: 0, y: 0, z: 0 },
                size: { x: 1, y: 1, z: 1 },
                leftTop: { x: 0, y: 0, z: 0 },
                rightBottom: { x: 0, y: 0, z: 0 },
                anchorMin: { x: 0.5, y: 0.5, z: 0.5 },
                anchorMax: { x: 0.5, y: 0.5, z: 0.5 },
                pivot: { x: 0.5, y: 0.5, z: 0.5 },
            };
            components.push(transformLayout);
        }
        this.#layoutRef.value = transformLayout;

        this.#installLayoutMirror();
        this.#installTransformMirror();
    }

    override beforeRender(renderObject: RenderObject): void
    {
        // uniform 容器由 UI 组件各自按需创建（见 uiUniforms），不依赖宿主组件的排列顺序
        uiUniforms(renderObject).u_rect = this.rect;
    }

    /**
     * 安装 Transform2D ↔ TransformLayout 的字段镜像。
     *
     * 两个 effect 各管一个方向，都遵循「变化驱动」（见 {@link #takeChange}）：
     * 数据侧没变时不覆盖布局侧，反之亦然。
     */
    #installLayoutMirror(): void
    {
        const r_data = this.#r_data;

        // @过渡 effect：数据 → 数据同步（与 Entity/Container 的同类 effect 同批处理，可 computed 化）
        effect(() =>
        {
            const layout = this.#layoutRef.value;
            if (!layout) return;
            const r_layout = reactive(layout);

            const position = r_data.position;
            const positionChanged = this.#takeChange('data.position', position ? [position.x, position.y] : null);
            if (position && positionChanged)
            {
                const target = r_layout.position ?? { x: 0, y: 0, z: 0 };
                if (target.x !== position.x || target.y !== position.y)
                {
                    r_layout.position = { x: position.x, y: position.y, z: target.z };
                }
            }

            const size = r_data.size;
            const sizeChanged = this.#takeChange('data.size', size ? [size.x, size.y] : null);
            if (size && sizeChanged)
            {
                const target = r_layout.size ?? { x: 1, y: 1, z: 1 };
                if (target.x !== size.x || target.y !== size.y)
                {
                    r_layout.size = { x: size.x, y: size.y, z: target.z };
                }
            }

            const anchorMin = r_data.anchorMin;
            const anchorMinChanged = this.#takeChange('data.anchorMin', anchorMin ? [anchorMin.x, anchorMin.y] : null);
            if (anchorMin && anchorMinChanged)
            {
                const target = r_layout.anchorMin ?? { x: 0.5, y: 0.5, z: 0.5 };
                if (target.x !== anchorMin.x || target.y !== anchorMin.y)
                {
                    r_layout.anchorMin = { x: anchorMin.x, y: anchorMin.y, z: target.z };
                }
            }

            const anchorMax = r_data.anchorMax;
            const anchorMaxChanged = this.#takeChange('data.anchorMax', anchorMax ? [anchorMax.x, anchorMax.y] : null);
            if (anchorMax && anchorMaxChanged)
            {
                const target = r_layout.anchorMax ?? { x: 0.5, y: 0.5, z: 0.5 };
                if (target.x !== anchorMax.x || target.y !== anchorMax.y)
                {
                    r_layout.anchorMax = { x: anchorMax.x, y: anchorMax.y, z: target.z };
                }
            }

            const pivot = r_data.pivot;
            const pivotChanged = this.#takeChange('data.pivot', pivot ? [pivot.x, pivot.y] : null);
            if (pivot && pivotChanged)
            {
                const target = r_layout.pivot ?? { x: 0.5, y: 0.5, z: 0.5 };
                if (target.x !== pivot.x || target.y !== pivot.y)
                {
                    r_layout.pivot = { x: pivot.x, y: pivot.y, z: target.z };
                }
            }

            // 边距四元组 ↔ leftTop.x / rightBottom.x / leftTop.y / rightBottom.y
            // （与迁移前的四条绑定逐一对应，不要重排顺序）
            const layoutValue = r_data.layout;
            const layoutChanged = this.#takeChange(
                'data.layout',
                layoutValue ? [layoutValue.x, layoutValue.y, layoutValue.z, layoutValue.w] : null,
            );
            if (layoutValue && layoutChanged)
            {
                const leftTop = r_layout.leftTop ?? { x: 0, y: 0, z: 0 };
                const rightBottom = r_layout.rightBottom ?? { x: 0, y: 0, z: 0 };
                if (leftTop.x !== layoutValue.x || rightBottom.x !== layoutValue.y
                    || leftTop.y !== layoutValue.z || rightBottom.y !== layoutValue.w)
                {
                    r_layout.leftTop = { x: layoutValue.x, y: layoutValue.z, z: leftTop.z };
                    r_layout.rightBottom = { x: layoutValue.y, y: layoutValue.w, z: rightBottom.z };
                }
            }
        });

        // @过渡 effect：数据 → 数据同步（方向与上一个 effect 相反，见 #takeChange 的防自激说明）
        effect(() =>
        {
            const layout = this.#layoutRef.value;
            if (!layout) return;
            const r_layout = reactive(layout);

            const position = r_layout.position;
            const positionChanged = this.#takeChange('layout.position', position ? [position.x, position.y] : null);
            if (position && positionChanged)
            {
                const target = r_data.position ?? { x: 0, y: 0 };
                if (target.x !== position.x || target.y !== position.y)
                {
                    r_data.position = { x: position.x, y: position.y };
                }
            }

            const size = r_layout.size;
            const sizeChanged = this.#takeChange('layout.size', size ? [size.x, size.y] : null);
            if (size && sizeChanged)
            {
                const target = r_data.size ?? { x: 1, y: 1 };
                if (target.x !== size.x || target.y !== size.y)
                {
                    r_data.size = { x: size.x, y: size.y };
                }
            }

            const anchorMin = r_layout.anchorMin;
            const anchorMinChanged = this.#takeChange('layout.anchorMin', anchorMin ? [anchorMin.x, anchorMin.y] : null);
            if (anchorMin && anchorMinChanged)
            {
                const target = r_data.anchorMin ?? { x: 0.5, y: 0.5 };
                if (target.x !== anchorMin.x || target.y !== anchorMin.y)
                {
                    r_data.anchorMin = { x: anchorMin.x, y: anchorMin.y };
                }
            }

            const anchorMax = r_layout.anchorMax;
            const anchorMaxChanged = this.#takeChange('layout.anchorMax', anchorMax ? [anchorMax.x, anchorMax.y] : null);
            if (anchorMax && anchorMaxChanged)
            {
                const target = r_data.anchorMax ?? { x: 0.5, y: 0.5 };
                if (target.x !== anchorMax.x || target.y !== anchorMax.y)
                {
                    r_data.anchorMax = { x: anchorMax.x, y: anchorMax.y };
                }
            }

            const pivot = r_layout.pivot;
            const pivotChanged = this.#takeChange('layout.pivot', pivot ? [pivot.x, pivot.y] : null);
            if (pivot && pivotChanged)
            {
                const target = r_data.pivot ?? { x: 0.5, y: 0.5 };
                if (target.x !== pivot.x || target.y !== pivot.y)
                {
                    r_data.pivot = { x: pivot.x, y: pivot.y };
                }
            }

            const leftTop = r_layout.leftTop;
            const rightBottom = r_layout.rightBottom;
            const layoutChanged = this.#takeChange(
                'layout.layout',
                leftTop && rightBottom ? [leftTop.x, rightBottom.x, leftTop.y, rightBottom.y] : null,
            );
            if (leftTop && rightBottom && layoutChanged)
            {
                const target = r_data.layout ?? { x: 0, y: 0, z: 0, w: 0 };
                if (target.x !== leftTop.x || target.y !== rightBottom.x
                    || target.z !== leftTop.y || target.w !== rightBottom.y)
                {
                    r_data.layout = { x: leftTop.x, y: rightBottom.x, z: leftTop.y, w: rightBottom.y };
                }
            }
        });
    }

    /**
     * 安装 Transform2D ↔ 宿主 Object3D 变换的镜像。
     *
     * 迁移前绑的是 `Transform` 组件的 `rotation.z` 与 `scale.x` / `scale.y`
     * （主仓已无独立 Transform 对象，这些数据直接挂在 Object3D 上）。
     */
    #installTransformMirror(): void
    {
        const r_data = this.#r_data;

        // @过渡 effect：数据 → 数据同步（Transform 组件已并入 Object3D，语义不变）
        effect(() =>
        {
            const entity = this.entity;
            const rotation = r_data.rotation;
            const rotationChanged = this.#takeChange('data.rotation', rotation ?? null);
            if (!entity || rotation === undefined || !rotationChanged) return;

            // 直接读写宿主对象的数据（与 Object3DLogic.rotation 同一数据源）：
            // 不用 `logic(entity)`——组件初始化 effect 期间宿主 logic 仍在构造中。
            const r_entity = reactive(entity);
            const transformRotation = r_entity.rotation ?? { x: 0, y: 0, z: 0 };
            if (transformRotation.z !== rotation)
            {
                r_entity.rotation = { x: transformRotation.x, y: transformRotation.y, z: rotation };
            }
        });

        // @过渡 effect：数据 → 数据同步（方向相反）
        effect(() =>
        {
            const entity = this.entity;
            if (!entity) return;

            const transformRotation = reactive(entity).rotation ?? { x: 0, y: 0, z: 0 };
            if (!this.#takeChange('entity.rotation', transformRotation.z)) return;

            if ((r_data.rotation ?? 0) !== transformRotation.z)
            {
                r_data.rotation = transformRotation.z;
            }
        });

        // @过渡 effect：数据 → 数据同步（只镜像 x / y，z 保持宿主对象原值，与迁移前一致）
        effect(() =>
        {
            const entity = this.entity;
            const scale = r_data.scale;
            const scaleChanged = this.#takeChange('data.scale', scale ? [scale.x, scale.y] : null);
            if (!entity || !scale || !scaleChanged) return;

            const r_entity = reactive(entity);
            const transformScale = r_entity.scale ?? { x: 1, y: 1, z: 1 };
            if (transformScale.x !== scale.x || transformScale.y !== scale.y)
            {
                r_entity.scale = { x: scale.x, y: scale.y, z: transformScale.z };
            }
        });

        // @过渡 effect：数据 → 数据同步（方向相反）
        effect(() =>
        {
            const entity = this.entity;
            if (!entity) return;

            const transformScale = reactive(entity).scale ?? { x: 1, y: 1, z: 1 };
            if (!this.#takeChange('entity.scale', [transformScale.x, transformScale.y])) return;

            const scale = r_data.scale ?? { x: 1, y: 1 };
            if (scale.x !== transformScale.x || scale.y !== transformScale.y)
            {
                r_data.scale = { x: transformScale.x, y: transformScale.y };
            }
        });
    }

    /**
     * 变化驱动的一次同步判定（复刻迁移前 `watcher.bind` 的语义）。
     *
     * @param key 字段标识（数据侧与布局侧用不同前缀，各记一份）
     * @param value 当前值（数值或数值数组，可 JSON 序列化）
     * @returns 相对上次记录**发生变化**时为 `true`；首次见到该 key 时只登记并返回 `false`
     */
    #takeChange(key: string, value: unknown): boolean
    {
        const text = JSON.stringify(value);
        const previous = this.#synced.get(key);
        this.#synced.set(key, text);

        return previous !== undefined && previous !== text;
    }
}

// 注册到统一 logic 分发表
registerLogic('Transform2D', Transform2DLogic as unknown as new (data: Transform2D) => Transform2DLogic);

// 登记组件类型（理由见 core/CanvasRenderer.ts）：Transform2D 是 Component3D（进而 Component）的子类型。
registerComponentType('Transform2D', { baseTypes: ['Component3D'] });

/**
 * 取对象（或其所属 Object3D）上的 Transform2D 组件数据。
 *
 * 迁移前 `transform2D` 是挂在 `Object3D.prototype` / `Component.prototype` 上的 getter；
 * 纯数据对象没有原型可挂，运行时给数据对象加属性也不符合主仓范式，故改为独立函数
 * （与 `findObject3DChild` 同形态）。
 *
 * @param target Object3D，或任意挂在 Object3D 上的组件
 * @returns Transform2D 数据；对象上没有该组件时返回 `null`
 */
export function getTransform2D(target: Object3D | Component3D): Transform2D | null
{
    const data = target as unknown as { __type__: string };
    const owner = data.__type__ === 'Object3D'
        ? target as Object3D
        // `logic()` 声明为非空，但未注册的类型运行时会返回 null / 构造中占位对象，故按可能取不到处理
        : getLogic(data)?.entity as Object3D | null;

    if (!owner) return null;

    return getLogic(owner).getComponent<Transform2D>('Transform2D') ?? null;
}
