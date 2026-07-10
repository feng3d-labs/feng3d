import { Component, Components, initComponent } from '../component/Component';
import { effect, reactive, toRaw } from '@feng3d/reactivity';
import type { Object3D } from './Object3D';

/**
 * 实体
 *
 * 组件容器的基础数据结构，仅包含组件列表。
 *
 * 纯数据接口：仅声明 readonly 属性，由 {@link createObject3D} 等工厂创建实例。
 * 所有行为逻辑（组件管理等）由 {@link entityLogic} 提供。
 */
export interface Entity
{
    /**
     * 类型名（用于 logic 分发）
     */
    readonly __type__: string;

    /**
     * 组件列表（缺失时由 registerDefaults 自动填充为空数组）
     *
     * 声明为 Component[] 以兼容所有组件子类型；具体子类型（Scene/Camera/MeshRenderer 等）
     * 通过自身字面量 `__type__` 与对应接口匹配，JSON 字面量形式可直接识别无需 `as` 断言。
     */
    readonly components?: Components[];
}

/**
 * Entity 逻辑处理输出。
 *
 * Entity 是纯组件容器，组件的增删直接操作 reactive(entity).components。
 * createEntityLogic 通过 effect 监听 components 变化，对新组件自动执行
 * ComponentLogic.initComponent（注入 object3D 并调用 init()）。
 */
export interface EntityLogic
{
}

/**
 * 创建 Entity 的 logic。
 *
 * 子模块（如 createObject3DLogic）调用本函数注册组件自动初始化的 effect。
 */
export function createEntityLogic(entity: Entity): EntityLogic
{
    effect(() =>
    {
        const r_components = reactive(entity).components as Component[];
        for (const r_component of r_components)
        {
            const rawComponent = toRaw(r_component);
            initComponent(rawComponent, entity as Object3D);
        }
    });

    return {};
}
