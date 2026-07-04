import { decoratorRegisterClass } from '@feng3d/polyfill';
import type { Component } from '../component/Component';

/**
 * 实体
 *
 * 组件容器的基础数据结构，仅包含组件列表。
 *
 * 纯数据结构体：仅包含 readonly 基础属性，可 JSON 序列化。
 * 所有行为逻辑（组件管理等）由 {@link entityLogic} 提供。
 */
@decoratorRegisterClass()
export class Entity
{
    __class__: string = 'Entity';

    /**
     * 组件列表
     */
    readonly components: Component[] = [];
}
