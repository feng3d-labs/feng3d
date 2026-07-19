import { Component, Components, ComponentLogic } from '../component/Component';
import { matchType } from '../component/componentQuery';
import { effect, reactive, toRaw, logic, registerLogic, computed, Computed } from '@feng3d/reactivity';
import type { Object3D } from './Object3D';

/**
 * 实体
 *
 * 组件容器的基础数据结构，仅包含组件列表。
 *
 * 纯数据接口：仅声明 readonly 属性，由 {@link createObject3D} 等工厂创建实例。
 * 所有行为逻辑（组件管理等）由 {@link EntityLogic} 提供。
 */
export interface Entity
{
    /**
     * 类型名（用于 logic 分发）
     */
    readonly __type__: string;

    /**
     * 组件列表（缺失时由 registerLogic 自动填充为空数组）
     *
     * 声明为 Component[] 以兼容所有组件子类型；具体子类型（Scene/Camera/MeshRenderer 等）
     * 通过自身字面量 `__type__` 与对应接口匹配，JSON 字面量形式可直接识别无需 `as` 断言。
     */
    readonly components?: Components[];
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Entity: EntityLogic;
    }
}

/**
 * Entity 逻辑处理基类。
 *
 * Entity 是纯组件容器，组件的增删直接操作 reactive(entity).components。
 * 构造函数注册 effect 监听 components 变化，对新组件自动执行
 * initComponent（注入 object3D 并调用 init()）。
 *
 * 子类继承链：EntityLogic → ContainerLogic → Object3DLogic。
 */
export class EntityLogic
{
    /** 已初始化组件去重（同一 component 只 init 一次） */
    private static _initialized = new WeakSet<Component>();

    /**
     * 组件列表（响应式 computed，建立对 raw.components 的依赖）。
     *
     * 注：raw.components 在构造函数中被 pre-fill 为 []（push/splice 写入路径需要存在数组）。
     */
    readonly components: Computed<Components[]> = computed(() =>
        reactive(this.entity).components as Components[]);

    constructor(protected entity: Entity)
    {
        // components pre-fill：push/splice 写入路径需要 raw.components 为已存在数组
        // （序列化前若无人 push 过，可在序列化时按需剔除空数组）
        if (entity.components === undefined)
        {
            (entity as { components: Components[] }).components = [];
        }

        effect(() =>
        {
            const r_components = reactive(entity).components as Component[];
            for (const r_component of r_components)
            {
                const rawComponent = toRaw(r_component);
                this.initComponent(rawComponent, entity as Object3D);
            }
        });
    }

    /**
     * 初始化组件 logic：注入 object3D 并调用 init（去重，同一 component 只初始化一次）。
     */
    private initComponent(component: Component, object3D: Object3D): void
    {
        const initialized = EntityLogic._initialized;
        if (initialized.has(component)) return;
        initialized.add(component);

        const l = logic(component) as ComponentLogic;
        if (l && typeof l.init === 'function')
        {
            l.init(object3D);
        }
    }

    /**
     * 获取指定类型的第一个组件。
     */
    getComponent<T extends Component>(typeName: string): T
    {
        return this.components.value.find(c => matchType(c, typeName)) as T;
    }

    /**
     * 获取所有匹配类型的组件。
     */
    getComponents<T extends Component>(typeName: string, results: T[] = []): T[]
    {
        for (const c of this.components.value)
        {
            if (!typeName || matchType(c, typeName)) results.push(c as T);
        }

        return results;
    }
}

// 注册到统一 logic 分发表（Entity 为抽象基类，通常不直接实例化；
// 若被独立使用，创建 EntityLogic 实例）
registerLogic('Entity', EntityLogic);