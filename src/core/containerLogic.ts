import { effect, reactive, toRaw } from '@feng3d/reactivity';
import { Container } from './Container';

/**
 * Container 逻辑处理输出。
 *
 * Container 是纯数据，子级的增删直接操作 reactive(container).children 即可。
 * containerLogic 通过 effect 监听 children 变化，自动同步 parent。
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 reactive(container) 的属性建立响应式依赖
 * 2. 修改 — 写入 reactive(container) 的属性触发响应式更新
 * 3. 传递 — 传递原始对象（非响应式对象）给其他函数
 */
export interface ContainerLogic
{
}

const logicMap = new WeakMap<Container, ContainerLogic>();
const initialized = new WeakSet<Container>();

/**
 * 获取 Container 的逻辑处理输出。
 *
 * 使用 WeakMap 缓存，同一 Container 始终返回同一组输出。
 */
export function containerLogic(container: Container): ContainerLogic
{
    let logic = logicMap.get(container);
    if (logic) return logic;

    logic = createContainerLogic(container);
    logicMap.set(container, logic);

    return logic;
}

function createContainerLogic(container: Container): ContainerLogic
{
    // 监听 children 变化，自动同步 parent。
    // 新 child push 进来时自动设置 parent = container。
    effect(() =>
    {
        const r_children = reactive(container).children as Container[];
        for (const r_child of r_children)
        {
            const child = toRaw(r_child);
            if (!initialized.has(child))
            {
                initialized.add(child);
                reactive(child).parent = container;
            }
        }
    });

    return {};
}
