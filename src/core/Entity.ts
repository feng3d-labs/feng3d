import { decoratorRegisterClass } from '@feng3d/polyfill';
import { Component } from '../component/Component';
import { Scene } from '../scene/Scene';

/**
 * 实体
 *
 * 场景中对象的基础数据结构，包含名称、标签、组件列表、父子层级关系等纯数据。
 *
 * 纯数据结构体：仅包含 readonly 基础属性，可 JSON 序列化。
 * 所有行为逻辑（组件管理、层级管理、生命周期等）由 {@link entityLogic} 提供。
 */
@decoratorRegisterClass()
export class Entity
{
    __class__: 'Entity';

    /**
     * 名称
     */
    readonly name: string = '';

    /**
     * 标签
     */
    readonly tag: string = '';

    /**
     * 自身以及子对象是否支持鼠标拾取
     */
    readonly mouseEnabled: boolean = true;

    /**
     * 本地激活状态
     */
    readonly activeSelf: boolean = true;

    /**
     * 组件列表
     */
    readonly components: Component[] = [];

    /**
     * 父级 Entity（只读，响应式）。
     *
     * 通过 reactive(this).parent = value 修改。
     */
    readonly parent: Entity | null = null;

    /**
     * 子对象列表
     */
    readonly children: Entity[] = [];

    /**
     * 所属场景（只读，响应式）
     */
    readonly scene: Scene | null = null;
}
