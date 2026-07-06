import { effect, reactive, toRaw } from '@feng3d/reactivity';
import { Container } from './Container';
import { logic, registerLogic } from '@feng3d/reactivity';

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
    return logic<ContainerLogic>(container);
}

/**
 * 创建 Container 的 logic。
 *
 * 子模块（如 createObject3DLogic）调用本函数注册 containerLogic 的 effect。
 */
export function createContainerLogic(container: Container): ContainerLogic
{
    const logicObj: ContainerLogic = {
        parent: null,
    };

    // 监听 children 变化，自动同步 parent。
    // 新 child push 进来时自动设置其 parent = container。
    effect(() =>
    {
        const r_children = reactive(container).children as Container[];
        for (const r_child of r_children)
        {
            const child = toRaw(r_child);
            // 读取建立响应式依赖
            const childLogic = logic<ContainerLogic>(child);
            if (childLogic && childLogic.parent !== container)
            {
                // 通过 reactive 写入（符合规范：readonly 数据通过 reactive 修改）
                reactive(childLogic).parent = container;
            }
        }
    });

    return logicObj;
}

// 注册到统一 logic 分发表
registerLogic('Container', createContainerLogic);
registerLogic('Entity', createContainerLogic);
