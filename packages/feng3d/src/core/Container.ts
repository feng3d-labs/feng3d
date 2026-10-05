import { Entity } from './Entity';
import { EntityLogic, matchType } from './Entity';
import { Components } from '../component/Component';
import { computed, effect, logic as getLogic, reactive, registerLogic, toRaw } from '@feng3d/reactivity';

/**
 * 容器
 *
 * 继承 Entity，在组件容器基础上增加父子层级关系。
 *
 * 纯数据接口：仅声明 readonly 属性，由 `{ __type__: 'Container' }` 等字面量创建实例。
 * 子对象不保存父引用（便于从 JSON 配置加载），父级关系由 {@link ContainerLogic}
 * 的 parent 响应式 getter 维护。
 */
export interface Container<T = Entity> extends Entity
{
    /**
     * 子对象列表（缺失时由 ContainerLogic 构造时自动填充为空数组）
     */
    readonly children?: T[];
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Container: ContainerLogic;
    }
}

/**
 * 每个 logic 实例的 parent 内部状态（响应式）。
 *
 * 用模块级 WeakMap 承载，使 `parent` getter 对外只读，内部通过 {@link setParent}
 * 写入。key 为 logic 实例（与 reactive 代理共享同一 WeakMap key 行为无关，这里用
 * 原始 logic 对象做 key）。
 */
function createParentStates()
{
    return new WeakMap<object, { parent: Container | null }>();
}

let _parentStates: ReturnType<typeof createParentStates> | null = null;

/** 取 getParentStates() 缓存（首次使用时创建；R2 零模块级副作用，issue #88） */
function getParentStates(): ReturnType<typeof createParentStates>
{
    if (!_parentStates)
    {
        _parentStates = createParentStates();
    }

    return _parentStates;
}

/**
 * 设置 logic 实例的 parent（内部 API，供父子同步 effect 与 dispose 使用）。
 *
 * `parent` 字段对外是只读 getter（外部不可赋值），父子关系仅由本函数维护：
 * - children→parent 自动同步 effect 调用本函数
 * - Object3DLogic.dispose 调用本函数置空 parent
 *
 * 按响应式规范：存原始对象，写入通过 reactive 代理（触发依赖 parent 的 computed 重算）。
 *
 * @param childLogic 子对象的 logic 实例
 * @param parent 新的父级（可为 null）
 */
export function setParent(childLogic: object, parent: Container | null): void
{
    const state = getParentStates().get(childLogic);
    if (state)
    {
        // 通过 reactive 代理写入，触发依赖 parent 的 computed 重算
        reactive(state).parent = parent;
    }
}

/**
 * 读取 logic 实例的 parent **原始值**（**不建立响应式依赖**）。
 *
 * 供父子同步 effect 做幂等判断用：那个 effect 会**写** parentState，因此它不能同时**读**
 * parentState（经 `childLogic.parent` 读会经 `reactive` 代理建立依赖）。读自己写的状态，
 * 平时看起来没事（第二次重跑时条件已不成立），但在批量刷新里会变成：
 * 写 → trigger → batch → computed 遍历子节点读 value → 又执行该 effect → 递归成环，
 * 直接 `RangeError: Maximum call stack size exceeded`（issue #177 的实测现场：
 * 反复卸载/重建场景视图时出现）。
 *
 * @param childLogic 子对象的 logic 实例
 * @returns 当前父级（未设置时为 `null`）
 */
export function parentOf(childLogic: object): Container | null
{
    return getParentStates().get(childLogic)?.parent ?? null;
}

/**
 * Container 逻辑类。
 *
 * 继承 EntityLogic（组件管理 + 自动初始化 effect），在此基础上叠加父子层级：
 * children computed + parent 只读 getter + children→parent 自动同步 effect。
 *
 * 父级关系不存储在 Container 数据中（便于从 JSON 配置加载），而是由 parentState
 *（响应式）维护。parent 对外为**只读 getter**，修改仅通过内部 {@link setParent} 进行。
 *
 * 被 Object3DLogic 继承以复用全部 Entity + Container 行为。
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 logic(container).parent 建立响应式依赖
 * 2. 修改 — 仅由内部 setParent / children 同步 effect 触发（外部不可赋值）
 * 3. 传递 — 传递原始对象（非响应式对象）给其他函数
 */
export class ContainerLogic extends EntityLogic
{
    /** 子对象列表（建立对 raw.children 的响应式依赖） */
    readonly #_children = computed(() => reactive(this._data as Container).children as Container[]);

    /** parent 内部状态（原始对象，getter 内用 reactive 建立依赖） */
    readonly #parentState: { parent: Container | null } = { parent: null };

    protected constructor(data: Container)
    {
        super(data);

        // ---- pre-fill：children 必须存在数组（push/splice 写入路径依赖） ----
        if ((data as Container).children === undefined)
        {
            (data as { children: Container[] }).children = [];
        }

        // state 注册到本实例，setParent 通过 logic(child) 拿到的对象能查到 state
        getParentStates().set(this, this.#parentState);

        // @边界 effect：children 增删 → 维护父子关系不变式（写 parentState）
        // ---- 监听 children 变化，自动同步 parent ----
        // 新 child push 进来时自动设置其 parent = container。
        effect(() =>
        {
            const r_children = this.#_children.value;
            for (const r_child of r_children)
            {
                // 防御：children 中可能出现 undefined/空洞（例如上层反序列化失败后
                // 仍把结果 push 进来）。此处跳过而不是让 logic(undefined) 抛 TypeError，
                // 否则该 effect 崩溃会中断整条响应式批次，表现为场景不渲染。
                if (r_child === undefined || r_child === null) continue;

                const child = toRaw(r_child) as Container;
                const childLogic = getLogic(child) as unknown as ContainerLogic | null;
                if (!childLogic) continue;

                // ⚠️ 幂等判断一定要读**原始 parent 状态**（`parentOf`），不能写 `childLogic.parent`：
                // 后者经响应式代理读，会把本 effect 挂到该 child 的 parentState 上，
                // 而紧接着的 `setParent` 正是写这个 state —— effect 依赖了自己要写的状态。
                // 平时看不出来（重跑时条件已不成立），但在批量刷新里会与外层 computed
                // 互相递归、直接爆栈（issue #177）。幂等判断只需要"当前值是多少"。
                if (parentOf(childLogic) !== data)
                {
                    setParent(childLogic, data);
                }
            }
        });

        // 最派生类判断（issue #222）：若还有子类（`Object3DLogic`），由它在自身字段初始化后
        // 再执行组件 init —— 组件的 init() 可能读宿主 logic 的 computed（位置/世界矩阵等），
        // 而那些字段在 super() 之后才初始化。
        if (new.target === ContainerLogic)
        {
            this.initComponents();
        }
    }

    /** 内部创建入口（protected constructor 的唯一出口，供子类使用） */
    static create(data: Container): ContainerLogic
    {
        return new ContainerLogic(data);
    }

    /** 子对象列表（响应式 computed） */
    get children(): Container[]
    {
        return this.#_children.value;
    }

    /** 父级容器（只读 getter，缺失时为 null） */
    get parent(): Container | null
    {
        return reactive(this.#parentState).parent;
    }

    /** 在自身及子孙中查找指定类型的第一个组件 */
    getComponentInChildren<T extends Components>(typeName: string, includeInactive = false): T
    {
        const self = this.getComponent<T>(typeName);
        if (self) return self;

        for (const r_child of this.#_children.value)
        {
            const child = toRaw(r_child) as Container;
            if (!includeInactive && !getLogic(child).parent) continue;
            const childLogic = getLogic(child) as unknown as ContainerLogic;
            if (!includeInactive && 'activeSelf' in childLogic && !childLogic.activeSelf) continue;
            const found = childLogic.getComponentInChildren<T>(typeName, includeInactive);
            if (found) return found;
        }

        return null as unknown as T;
    }

    /** 在自身及子孙中查找所有匹配类型的组件 */
    getComponentsInChildren<T extends Components>(typeName: string, includeInactive = false, results: T[] = []): T[]
    {
        this.getComponents<T>(typeName, results);

        for (const r_child of this.#_children.value)
        {
            const child = toRaw(r_child) as Container;
            const childLogic = getLogic(child) as unknown as ContainerLogic;
            if (!includeInactive && 'activeSelf' in childLogic && !childLogic.activeSelf) continue;
            childLogic.getComponentsInChildren<T>(typeName, includeInactive, results);
        }

        return results;
    }

    /** 在自身及父级中查找指定类型的第一个组件 */
    getComponentInParent<T extends Components>(typeName: string, includeInactive = false): T
    {
        const selfComp = this.getComponent<T>(typeName);
        if (selfComp) return selfComp;

        let r_parent = reactive(this.#parentState).parent as Container | null;
        while (r_parent)
        {
            const parent = toRaw(r_parent) as Container;
            const parentLogic = getLogic(parent) as unknown as ContainerLogic;
            if (includeInactive || !('activeSelf' in parentLogic) || parentLogic.activeSelf)
            {
                const c = parent.components?.find(c => matchType(c, typeName)) as T;
                if (c) return c;
            }
            r_parent = parentLogic.parent as Container | null;
        }

        return null as unknown as T;
    }

    /** 在自身及父级中查找所有匹配类型的组件 */
    getComponentsInParent<T extends Components>(typeName: string, includeInactive = false, results: T[] = []): T[]
    {
        this.getComponents<T>(typeName, results);

        let r_parent = reactive(this.#parentState).parent as Container | null;
        while (r_parent)
        {
            const parent = toRaw(r_parent) as Container;
            const parentLogic = getLogic(parent) as unknown as ContainerLogic;
            if (includeInactive || !('activeSelf' in parentLogic) || parentLogic.activeSelf)
            {
                for (const c of parent.components ?? [])
                {
                    if (!typeName || matchType(c, typeName)) results.push(c as T);
                }
            }
            r_parent = parentLogic.parent as Container | null;
        }

        return results;
    }
}

// 注册到统一 logic 分发表（Container 为抽象基类，通常不直接实例化；
// 若被独立使用，创建 ContainerLogic 实例）
registerLogic('Container', ContainerLogic.create);
