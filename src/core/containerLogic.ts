import { effect, reactive, toRaw, UnReadonly } from '@feng3d/reactivity';
import { Container } from './Container';
import { logic, registerLogic } from '@feng3d/reactivity';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Container: ContainerLogic;
        Entity: ContainerLogic;
    }
}

/**
 * Container 逻辑处理输出。
 *
 * Container 是纯数据，子级的增删直接操作 reactive(container).children 即可。
 * logic(container) 通过 effect 监听 children 变化，自动同步 parent。
 *
 * 父级关系不存储在 Container 数据中（便于从 JSON 配置加载），而是由每个
 * ContainerLogic 实例自身的响应式 parent 字段维护。
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 logic(container).parent 建立响应式依赖
 * 2. 修改 — 通过 reactive(logic(child)).parent = value 触发响应式更新
 * 3. 传递 — 传递原始对象（非响应式对象）给其他函数
 */
export interface ContainerLogic
{
    /**
     * 父级容器（readonly 响应式字段）。
     *
     * 通过 reactive(logic(child)).parent = value 修改。
     */
    readonly parent: Container | null;
}

/**
 * 获取 Container 的 logic（统一 logic 入口的类型化便捷封装）。
 */
export function containerLogic(container: Container): ContainerLogic
{
    return logic(container);
}

/**
 * 创建 Container 的 logic。
 *
 * 在传入的 logicObj 上设置 parent 字段并注册 children→parent 同步 effect，
 * 返回同一对象。这样 Object3DLogic 等"扩展自 ContainerLogic"的类型可以共用
 * 同一个返回对象，而非通过独立对象中转 parent。
 */
export function createContainerLogic<T extends ContainerLogic>(container: Container, logicObj: T): T
{
    // parent 虽声明为 readonly（符合"数据 readonly、通过 reactive 修改"规范），
    // 但此处是初始化赋值，用 UnReadonly 绕过类型检查。
    (logicObj as UnReadonly<ContainerLogic>).parent = null;

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

    return logicObj;
}

// 注册到统一 logic 分发表（Container/Entity 为抽象基类，通常不直接实例化；
// 若被独立使用，创建最小 ContainerLogic 累积对象）
registerLogic('Container', (container: Container) => createContainerLogic(container, { parent: null }));
registerLogic('Entity', (container: Container) => createContainerLogic(container, { parent: null }));
