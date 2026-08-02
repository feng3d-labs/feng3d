import { Components, ComponentLogic } from '../component/Component';
import { computed, effect, logic as getLogic, reactive, registerLogic, toRaw } from '@feng3d/reactivity';
import type { Object3D } from './Object3D';

/**
 * 实体
 *
 * 组件容器的基础数据结构，仅包含组件列表。
 *
 * 纯数据接口：仅声明 readonly 属性，由 `{ __type__: 'Entity' }` 等字面量创建实例。
 * 所有行为逻辑（组件管理等）由 {@link entityLogic} 提供。
 */
export interface Entity
{
    /**
     * 类型名（用于 logic 分发）
     */
    readonly __type__: string;

    /**
     * 组件列表（缺失时由 registerLogic 自动填充为空数组）
     */
    readonly components?: Components[];
}

// ---- 类型继承关系表（用于 matchType 快速查找） ----

const _typeHierarchy: Record<string, Set<string>> = {
    'Component': new Set(['Component', 'Behaviour', 'RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water', 'ParticleSystem', 'Light', 'DirectionalLight', 'PointLight', 'SpotLight', 'Animation', 'AudioListener', 'AudioSource', 'FPSController', 'OrbitControls', 'Script', 'Skeleton', 'Camera', 'PerspectiveCamera', 'OrthographicCamera', 'Scene', 'SkyBox', 'TransformLayout', 'Billboard', 'Cartoon', 'OutLine', 'Wireframe', 'HoldSize', 'Graphics', 'Terrain']),
    'Behaviour': new Set(['Behaviour', 'RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water', 'ParticleSystem', 'Light', 'DirectionalLight', 'PointLight', 'SpotLight', 'Animation', 'AudioListener', 'AudioSource', 'FPSController', 'OrbitControls', 'Script']),
    'RayCastable': new Set(['RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water', 'ParticleSystem']),
    'Renderable': new Set(['Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water', 'ParticleSystem', 'Terrain']),
    'Light': new Set(['Light', 'DirectionalLight', 'PointLight', 'SpotLight']),
    'Camera': new Set(['Camera', 'PerspectiveCamera', 'OrthographicCamera']),
};

/**
 * 判断组件是否匹配指定类型（含子类型）。
 *
 * 先查静态类型表（快路径），未命中时通过 logic 实例的构造函数原型链判断
 * （支持用户动态 registerLogic 注册的子类型）。
 */
export function matchType(component: Components, typeName: string): boolean
{
    if (!typeName) return true;
    const type = (component as { __type__: string }).__type__;
    if (type === typeName) return true;
    const subtypes = _typeHierarchy[typeName];
    if (subtypes && subtypes.has(type)) return true;

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
 * entityLogic 实例接口（显式声明，避免 ReturnType 与 {@link Object.defineProperty}
 * 返回类型被推断为 {}）。
 *
 * 通过 `logic(entity)` 获取实例。由 entityLogic 工厂返回值实现，并被
 * containerLogic / object3DLogic 组合复用。
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
 * 已初始化组件去重（同一 component 只 init 一次，跨 logic 实例共享）。
 *
 * 模块级 WeakSet：无论哪个 logic 工厂（entityLogic / containerLogic / object3DLogic）
 * 处理组件，同一 component 实例全局只 init 一次。
 */
const _initialized = new WeakSet<Components>();

/**
 * 创建 EntityLogic 实例（函数式实现）。
 *
 * Entity 是纯组件容器，组件的增删直接操作 reactive(entity).components。
 * 工厂内部注册 effect 监听 components 变化，对新组件自动执行 initComponent
 *（注入 object3D 并调用 init()）。
 *
 * 作为 logic 组合链的最底层，被 containerLogic / object3DLogic 调用以复用
 * 组件管理行为（getComponent / getComponents / 自动初始化 effect）。
 *
 * raw 数据保持干净：缺失的 components 字段被 pre-fill 为空数组（push/splice
 * 写入路径依赖），其它字段不写入。
 *
 * 通过 registerLogic('Entity', entityLogic) 注册，调用方用 `logic(entity)` 获取实例。
 */
export function entityLogic(entity: Entity)
{
    // ---- pre-fill：components 必须存在数组（push/splice 写入路径依赖） ----
    if (entity.components === undefined)
    {
        (entity as { components: Components[] }).components = [];
    }

    // ---- 字段 computed（建立对 raw.components 的依赖） ----
    const components = computed(() => reactive(entity).components as Components[]);

    // ---- 自动初始化 effect：监听 components 变化 ----
    function initComponent(component: Components, owner: Object3D): void
    {
        if (_initialized.has(component)) return;
        _initialized.add(component);
        const l = getLogic(component) as ComponentLogic;
        if (l && typeof l.init === 'function')
        {
            l.init(owner);
        }
    }

    effect(() =>
    {
        const r_components = components.value;
        for (const r_component of r_components)
        {
            initComponent(toRaw(r_component), entity as Object3D);
        }
    });

    // ---- 方法 ----
    function getComponentMethod<T extends Components>(typeName: string): T
    {
        return components.value.find(c => matchType(c, typeName)) as T;
    }

    function getComponentsMethod<T extends Components>(typeName: string, results: T[] = []): T[]
    {
        for (const c of components.value)
        {
            if (!typeName || matchType(c, typeName)) results.push(c as T);
        }

        return results;
    }

    return {
        get entity() { return entity; },
        get components() { return components.value; },
        getComponent: getComponentMethod,
        getComponents: getComponentsMethod,
    };
}

// 注册到统一 logic 分发表（Entity 为抽象基类，通常不直接实例化；
// 若被独立使用，创建 entityLogic 实例）
registerLogic('Entity', entityLogic);
