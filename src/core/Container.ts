import { Entity } from './Entity';

/**
 * 容器
 *
 * 继承 Entity，在组件容器基础上增加父子层级关系。
 *
 * 纯数据接口：仅声明 readonly 属性，由 {@link createObject3D} 等工厂创建实例。
 * 所有行为逻辑（层级管理等）由 {@link containerLogic} 提供。
 */
export interface Container extends Entity
{
    /**
     * 父级 Container（只读，响应式）。
     *
     * 通过 reactive(this).parent = value 修改。
     */
    readonly parent: Container | null;

    /**
     * 子对象列表
     */
    readonly children: Container[];
}
