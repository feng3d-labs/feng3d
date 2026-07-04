import type { Component } from '../component/Component';

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
    __class__: string;

    /**
     * 组件列表
     */
    readonly components: Component[];
}
