import type { Component, Components } from '../component/Component';

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
     * 类名标记（资产系统读取，保留兼容）
     */
    readonly __class__: 'Entity';

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
