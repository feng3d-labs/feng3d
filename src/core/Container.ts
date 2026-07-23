import { Entity } from './Entity';
import { entityLogic, EntityLogicInstance } from './Entity';
import { computed, effect, logic as getLogic, reactive, registerLogic, toRaw } from '@feng3d/reactivity';

/**
 * 容器
 *
 * 继承 Entity，在组件容器基础上增加父子层级关系。
 *
 * 纯数据接口：仅声明 readonly 属性，由 `{ __type__: 'Container' }` 等字面量创建实例。
 * 子对象不保存父引用（便于从 JSON 配置加载），父级关系由 {@link containerLogic}
 * 返回的 parent 响应式 getter 维护。
 */
export interface Container<T = Entity> extends Entity
{
    /**
     * 子对象列表（缺失时由 registerLogic 自动填充为空数组）
     */
    readonly children?: T[];
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Container: ContainerLogicInstance;
    }
}

/**
 * containerLogic 实例接口（显式声明，避免 {@link Object.defineProperty}
 * 返回类型被推断为 {}）。
 *
 * 继承 EntityLogicInstance（组合复用 Entity 行为），叠加 children / parent。
 * parent 为**只读 getter**（外部不可赋值，仅由内部 setParent 维护）。
 */
export interface ContainerLogicInstance extends EntityLogicInstance
{
    /** 子对象列表（响应式 computed） */
    readonly children: Container[];
    /** 父级容器（只读 getter，缺失时为 null） */
    readonly parent: Container | null;
}

/**
 * 每个 logic 实例的 parent 内部状态（响应式）。
 *
 * 用模块级 WeakMap 承载，使 `parent` getter 对外只读，内部通过 {@link setParent}
 * 写入。key 为 logic 实例（与 reactive 代理共享同一 WeakMap key 行为无关，这里用
 * 原始 logic 对象做 key）。
 */
const _parentStates = new WeakMap<object, { parent: Container | null }>();

/**
 * 设置 logic 实例的 parent（内部 API，供父子同步 effect 与 dispose 使用）。
 *
 * `parent` 字段对外是只读 getter（外部不可赋值），父子关系仅由本函数维护：
 * - children→parent 自动同步 effect 调用本函数
 * - object3DLogic.dispose 调用本函数置空 parent
 *
 * 按响应式规范：存原始对象，写入通过 reactive 代理（触发依赖 parent 的 computed 重算）。
 *
 * @param childLogic 子对象的 logic 实例
 * @param parent 新的父级（可为 null）
 */
export function setParent(childLogic: object, parent: Container | null): void
{
    const state = _parentStates.get(childLogic);
    if (state)
    {
        // 通过 reactive 代理写入，触发依赖 parent 的 computed 重算
        reactive(state).parent = parent;
    }
}

/**
 * 创建 ContainerLogic 实例（函数式实现）。
 *
 * 组合 {@link entityLogic} 获得全部 Entity 行为（组件管理 + 自动初始化 effect），
 * 在此基础上叠加父子层级：children computed + parent 只读 getter + children→parent
 * 自动同步 effect。
 *
 * 父级关系不存储在 Container 数据中（便于从 JSON 配置加载），而是由 parentState
 *（响应式）维护。parent 对外为**只读 getter**，修改仅通过内部 {@link setParent} 进行。
 *
 * 作为 logic 组合链的中间层，被 object3DLogic 调用以复用全部 Entity + Container 行为。
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 logic(container).parent 建立响应式依赖
 * 2. 修改 — 仅由内部 setParent / children 同步 effect 触发（外部不可赋值）
 * 3. 传递 — 传递原始对象（非响应式对象）给其他函数
 */
export function containerLogic(container: Container): ContainerLogicInstance
{
    // ---- 组合 Entity 行为（组件管理 + 自动初始化 effect） ----
    const base = entityLogic(container);

    // ---- pre-fill：children 必须存在数组（push/splice 写入路径依赖） ----
    if (container.children === undefined)
    {
        (container as { children: Container[] }).children = [];
    }

    // ---- 字段 computed（建立对 raw.children 的依赖） ----
    const children = computed(() => reactive(container).children as Container[]);

    // ---- parent 内部状态（原始对象，getter 内用 reactive 建立依赖） ----
    // 按规范：存原始对象，不在模块级/字段持有响应式代理；getter 内 reactive(state) 建立依赖。
    // 注意：state 必须注册到 base（=本工厂返回对象，被 object3DLogic 复用），
    // 这样 setParent 通过 logic(child) 拿到的对象能查到 state。
    const parentState: { parent: Container | null } = { parent: null };
    _parentStates.set(base, parentState);

    // ---- 监听 children 变化，自动同步 parent ----
    // 新 child push 进来时自动设置其 parent = container。
    effect(() =>
    {
        const r_children = children.value;
        for (const r_child of r_children)
        {
            const child = toRaw(r_child) as Container;
            const childLogic = getLogic(child);
            if (childLogic && childLogic.parent !== container)
            {
                setParent(childLogic, container);
            }
        }
    });

    // ---- 在 base 上叠加本层字段（复用同一对象引用，保证 setParent 能查到 parentState） ----
    // 直接在 base 上 defineProperties，不创建新对象（object3DLogic 同样复用本对象）。
    // getter 内 reactive(parentState) 建立响应式依赖（懒追踪）。
    Object.defineProperties(base, {
        children: { get() { return children.value; }, enumerable: true, configurable: true },
        parent: { get() { return reactive(parentState).parent; }, enumerable: true, configurable: true },
    });

    return base as unknown as ContainerLogicInstance;
}

// 注册到统一 logic 分发表（Container 为抽象基类，通常不直接实例化；
// 若被独立使用，创建 containerLogic 实例）
registerLogic('Container', containerLogic);
