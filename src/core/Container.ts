import { decoratorRegisterClass } from '@feng3d/polyfill';
import { Entity } from './Entity';

/**
 * 容器
 *
 * 继承 Entity，在组件容器基础上增加父子层级关系。
 *
 * 纯数据结构体：仅包含 readonly 基础属性，可 JSON 序列化。
 * 所有行为逻辑（层级管理等）由 {@link containerLogic} 提供。
 */
@decoratorRegisterClass()
export class Container extends Entity
{
    /**
     * 父级 Container（只读，响应式）。
     *
     * 通过 reactive(this).parent = value 修改。
     */
    readonly parent: Container | null = null;

    /**
     * 子对象列表
     */
    readonly children: Container[] = [];
}
