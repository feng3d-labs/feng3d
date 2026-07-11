import { Entity, EntityLogic } from './Entity';
import { effect, reactive, toRaw, logic, registerLogic } from '@feng3d/reactivity';

/**
 * 容器
 *
 * 继承 Entity，在组件容器基础上增加父子层级关系。
 *
 * 纯数据接口：仅声明 readonly 属性，由 {@link createObject3D} 等工厂创建实例。
 * 子对象不保存父引用（便于从 JSON 配置加载），父级关系由 {@link logic}
 * 返回的 ContainerLogic.parent 响应式字段维护。
 */
export interface Container<T = any> extends Entity
{
    /**
     * 子对象列表（缺失时由 registerLogic 自动填充为空数组）
     */
    readonly children?: T[];
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Container: ContainerLogic;
    }
}

/**
 * Container 逻辑处理类。
 *
 * 继承 EntityLogic：组件自动初始化 effect + getComponent/getComponents。
 *
 * Container 是纯数据，子级的增删直接操作 reactive(container).children 即可。
 * 构造函数注册 effect 监听 children 变化，自动同步 parent。
 *
 * 父级关系不存储在 Container 数据中（便于从 JSON 配置加载），而是由每个
 * ContainerLogic 实例自身的响应式 parent 字段维护。
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 logic(container).parent 建立响应式依赖
 * 2. 修改 — 通过 reactive(logic(child)).parent = value 触发响应式更新
 * 3. 传递 — 传递原始对象（非响应式对象）给其他函数
 */
export class ContainerLogic extends EntityLogic
{
    /**
     * 父级容器（响应式字段）。
     *
     * 通过 reactive(logic(child)).parent = value 修改。
     */
    parent: Container | null = null;

    /** 关联的 Container 数据（与基类 entity 同一对象，强类型为 Container） */
    protected get container(): Container { return this.entity as unknown as Container; }

    constructor(container: Container)
    {
        super(container);
        // 监听 children 变化，自动同步 parent。
        // 新 child push 进来时自动设置其 parent = container。
        effect(() =>
        {
            const r_children = reactive(container).children as Container[];
            for (const r_child of r_children)
            {
                const child = toRaw(r_child);
                // 读取建立响应式依赖
                const childLogic = logic(child);
                if (childLogic && childLogic.parent !== container)
                {
                    // 通过 reactive 写入（符合规范：readonly 数据通过 reactive 修改）
                    reactive(childLogic).parent = container;
                }
            }
        });
    }
}
// 注册到统一 logic 分发表（Container 为抽象基类，通常不直接实例化；
// 若被独立使用，创建 ContainerLogic 实例）
registerLogic('Container', (container: Container) => new ContainerLogic(container));
