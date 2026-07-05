import { Entity } from './Entity';

/**
 * 容器
 *
 * 继承 Entity，在组件容器基础上增加父子层级关系。
 *
 * 纯数据接口：仅声明 readonly 属性，由 {@link createObject3D} 等工厂创建实例。
 * 子对象不保存父引用（便于从 JSON 配置加载），父级关系由 {@link logic}
 * 返回的 ContainerLogic.parent 响应式字段维护。
 */
export interface Container extends Entity
{
    /**
     * 子对象列表
     */
    readonly children: Container[];
}
