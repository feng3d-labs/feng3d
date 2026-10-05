import { Components, ComponentLogic, getComponentTypeInfo } from '../component/Component';
import { computed, effect, logic as getLogic, reactive, registerLogic, toRaw, type Computed } from '@feng3d/reactivity';
import type { Object3D } from './Object3D';

/**
 * 实体
 *
 * 组件容器的基础数据结构，仅包含组件列表。
 *
 * 纯数据接口：仅声明 readonly 属性，由 `{ __type__: 'Entity' }` 等字面量创建实例。
 * 所有行为逻辑（组件管理等）由 {@link EntityLogic} 提供。
 */
export interface Entity
{
    /**
     * 类型名（用于 logic 分发）
     */
    readonly __type__: string;

    /**
     * 组件列表（缺失时由 EntityLogic 构造时自动填充为空数组）
     */
    readonly components?: Components[];
}

// ---- 类型继承关系表（用于 matchType 快速查找） ----

/**
 * 内置组件的「类型名 → 其全部子类型」反查表（快路径）。
 *
 * 只登记 **feng3d 自己的**类型：上层扩展包（`@feng3d/ui` / `particlesystem` / `terrain`）的类型
 * 一律走 `registerComponentType`（`component/Component.ts`）登记——地基包不硬编码上层包的类型名。
 *
 * `Component3D` 是引擎自己的标记接口（挂在 Object3D 上的组件，`Component` 的子类型），
 * 上层扩展包登记 `{ baseTypes: ['Component3D'] }` 时靠它上溯到 `Component`。
 */
const _typeHierarchy: Record<string, Set<string>> = {
    'Component': new Set(['Component', 'Component3D', 'Behaviour', 'RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'ParticleSystem', 'Light', 'DirectionalLight', 'PointLight', 'SpotLight', 'Animation', 'AudioListener', 'AudioSource', 'FPSController', 'OrbitControls', 'Script', 'Skeleton', 'Camera', 'PerspectiveCamera', 'OrthographicCamera', 'Scene', 'SkyBox', 'TransformLayout', 'Billboard', 'Cartoon', 'OutLine', 'Wireframe', 'HoldSize', 'Graphics', 'Terrain']),
    'Component3D': new Set(['Component3D']),
    'Behaviour': new Set(['Behaviour', 'RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'ParticleSystem', 'Light', 'DirectionalLight', 'PointLight', 'SpotLight', 'Animation', 'AudioListener', 'AudioSource', 'FPSController', 'OrbitControls', 'Script']),
    'RayCastable': new Set(['RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'ParticleSystem']),
    'Renderable': new Set(['Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'ParticleSystem', 'Terrain']),
    'Light': new Set(['Light', 'DirectionalLight', 'PointLight', 'SpotLight']),
    'Camera': new Set(['Camera', 'PerspectiveCamera', 'OrthographicCamera']),
};

/**
 * 判断组件是否匹配指定类型（含子类型）。
 *
 * 三条判据，任一命中即算匹配：
 * 1. 类型名相同（快路径）；
 * 2. 内置反查表 `_typeHierarchy[typeName]` 命中；
 * 3. 该类型是**上层扩展包登记**的类型（`registerComponentType`）——沿登记的基类型链上溯，
 *    每一跳再与内置表比对（这样 `{ baseTypes: ['Renderable'] }` 登记的类型在
 *    `matchType(x, 'Behaviour')` / `matchType(x, 'Component')` 下同样命中）。
 *
 * 第 3 条是本函数此前**注释里声称、实现里没有**的那段（原注释写「未命中时通过 logic 实例的
 * 构造函数原型链判断」）——原型链判据不成立（Logic 的继承关系与 `ComponentMap` 的接口继承
 * 不必一致，且很多 Logic 是工厂函数、没有可用的原型链），改为显式登记。
 *
 * @param component 组件数据
 * @param typeName 目标类型名
 * @returns 匹配则 true
 */
export function matchType(component: Components, typeName: string): boolean
{
    if (!typeName) return true;
    const type = (component as { __type__: string }).__type__;
    if (type === typeName) return true;
    const subtypes = _typeHierarchy[typeName];
    if (subtypes && subtypes.has(type)) return true;

    return matchesRegisteredBase(type, typeName);
}

/**
 * 沿「登记的类型 → 其基类型」链判断 `typeName` 是否是它的基类型（或其基类型的超类型）。
 *
 * @param type 待查类型名
 * @param typeName 目标基类型名
 * @param visited 已访问类型名（防登记成环导致无限递归）
 * @returns 匹配则 true
 */
function matchesRegisteredBase(type: string, typeName: string, visited: Set<string> = new Set()): boolean
{
    if (visited.has(type)) return false;
    visited.add(type);

    const info = getComponentTypeInfo(type);
    if (!info) return false;

    for (const base of info.baseTypes)
    {
        if (base === typeName) return true;
        // 基类型本身是 typeName 的子类型（如 baseType 'Renderable' ⊂ 'Behaviour' ⊂ 'Component'）
        if (_typeHierarchy[typeName]?.has(base)) return true;
        // 基类型自己还有基类型（如 'Component3D' 之外的多跳登记）
        if (matchesRegisteredBase(base, typeName, visited)) return true;
    }

    return false;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Entity: EntityLogic;
    }
}

/**
 * 已初始化组件去重（同一 component 只 init 一次，跨 logic 实例共享）。
 *
 * 模块级 WeakSet：无论哪个 logic（EntityLogic / ContainerLogic / Object3DLogic）
 * 处理组件，同一 component 实例全局只 init 一次。
 *
 * 缓存一律 lazy-init（R2，issue #606）：`new WeakSet()` 放在 getter 里，
 * 避免 import 即执行——`WeakSet` 与 `Map/WeakMap/Set` 同属被禁形态
 * （此前判据漏了它的名字，被两条门禁同时放行）。
 */
let _initialized: WeakSet<Components> | null = null;

function getInitialized(): WeakSet<Components>
{
    if (!_initialized) _initialized = new WeakSet();

    return _initialized;
}

/**
 * 初始化单个组件（同一 component 全局只 init 一次）。
 */
function initComponent(component: Components, owner: Object3D): void
{
    const initialized = getInitialized();

    if (initialized.has(component)) return;
    initialized.add(component);
    const l = getLogic(component) as ComponentLogic;
    if (l && typeof l.init === 'function')
    {
        l.init(owner);
    }
}

/**
 * Entity 逻辑类（logic 组合链最底层）。
 *
 * Entity 是纯组件容器，组件的增删直接操作 reactive(entity).components。
 * 构造时注册 effect 监听 components 变化，对新组件自动执行 initComponent
 *（注入 object3D 并调用 init()）。
 *
 * 被 ContainerLogic / Object3DLogic 继承以复用组件管理行为。
 *
 * raw 数据保持干净：缺失的 components 字段被 pre-fill 为空数组（push/splice
 * 写入路径依赖），其它字段不写入。
 */
export interface EntityLogic
{
    /** 关联的 Entity 数据（raw） */
    readonly entity: Entity;

    /** 组件列表（响应式 computed） */
    readonly components: Components[];

    /** 获取指定类型的第一个组件 */
    getComponent<T extends Components>(typeName: string): T;

    /** 获取所有匹配类型的组件 */
    getComponents<T extends Components>(typeName: string, results?: T[]): T[];
}

/**
 * Entity 系 Logic 实例的内部状态（不进公开接口，工厂闭包持有）。
 */
export interface EntityLogicState
{
    /** 纯数据引用（子类读取自身具体数据字段用） */
    data: Entity;

    /** 组件列表（建立对 raw.components 的响应式依赖） */
    components: Computed<Components[]>;

    /** 组件初始化 effect 是否已安装（幂等） */
    componentsEffectInstalled: boolean;
}

/**
 * EntityLogic 的**基类行为**（组合用）：成员都读写同一个 `state`。
 *
 * 形态：工厂闭包直接返回对象字面量（无共享 proto、无 this）。子类工厂的用法：
 * ```ts
 * const { state, members } = createEntityLogicBase(data);
 * const logic: XxxLogic = {
 *     get entity() { return members.entity; },
 *     get components() { return members.components; },
 *     getComponent(typeName) { return members.getComponent(typeName); },
 *     getComponents(typeName, results) { return members.getComponents(typeName, results); },
 *     // ...自身成员
 * };
 * ```
 *
 * @param data 实体数据（raw）
 */
export function createEntityLogicBase(data: Entity): { state: EntityLogicState; members: EntityLogic }
{
    // ---- pre-fill：components 必须存在数组（push/splice 写入路径依赖） ----
    if (data.components === undefined)
    {
        (data as { components: Components[] }).components = [];
    }

    const state: EntityLogicState = {
        data,
        // 组件列表：computed 建立对 raw.components 的响应式依赖
        components: computed(() => reactive(data).components as Components[]),
        componentsEffectInstalled: false,
    };

    const members: EntityLogic = {
        /** 关联的 Entity 数据（raw） */
        get entity() { return state.data; },
        /** 组件列表（响应式 computed） */
        get components() { return state.components.value; },
        /** 获取指定类型的第一个组件 */
        getComponent<T extends Components>(typeName: string): T
        {
            return state.components.value.find(c => matchType(c, typeName)) as T;
        },
        /** 获取所有匹配类型的组件 */
        getComponents<T extends Components>(typeName: string, results: T[] = []): T[]
        {
            for (const c of state.components.value)
            {
                if (!typeName || matchType(c, typeName)) results.push(c as T);
            }

            return results;
        },
    };

    return { state, members };
}

/**
 * 安装「组件自动初始化」effect（幂等）。
 *
 * 由**最派生**的 Logic 工厂在装配末尾调用（issue #222）：组件的 init() 可能在宿主
 * children / computed 上读写，而那些字段要到最派生工厂才装完，所以必须推迟。
 * 工厂版本下不再有 `new.target`——由各工厂显式选择是否调用本函数：
 * `entityLogic` / `containerLogic` 各自是所在链的最派生，直接调用；
 * `object3DLogic` 则走 `createContainerLogicBase`、在自己的字段装完后调用。
 *
 * @param logic 已装配好的实例
 * @param state 该实例的 Entity 基类状态
 */
export function initComponents(logic: EntityLogic, state: EntityLogicState): void
{
    if (state.componentsEffectInstalled) return;
    state.componentsEffectInstalled = true;

    // @边界 effect：结构变更 → logic.init 命令式分发（init 是外部副作用，无法 pull 化）
    // ---- 自动初始化 effect：监听 components 变化 ----
    effect(() =>
    {
        const r_components = logic.components;
        for (const r_component of r_components)
        {
            initComponent(toRaw(r_component), state.data as Object3D);
        }
    });
}

/**
 * 工厂函数：EntityLogic 的唯一创建入口。
 *
 * EntityLogic 是这条链的最派生（子类工厂走 `createEntityLogicBase` 组合），
 * 因此装配完直接初始化组件。
 */
export function entityLogic(data: Entity): EntityLogic
{
    const { state, members } = createEntityLogicBase(data);
    initComponents(members, state);

    return members;
}

// 注册到统一 logic 分发表（Entity 为抽象基类，通常不直接实例化；
// 若被独立使用，创建 EntityLogic 实例）
registerLogic('Entity', entityLogic);
