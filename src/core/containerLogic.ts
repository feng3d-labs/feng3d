import { reactive } from '@feng3d/reactivity';
import { Container } from './Container';

/**
 * Container 逻辑处理输出。
 *
 * 包含父子层级管理等行为函数。
 * 所有响应式依赖封装在 containerLogic 闭包内。
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 reactive(container) 的属性建立响应式依赖
 * 2. 修改 — 写入 reactive(container) 的属性触发响应式更新
 * 3. 传递 — 传递原始对象（非响应式对象）给其他函数
 */
export interface ContainerLogic
{
    addChild(child: Container): Container;
    removeChild(child: Container): void;
    removeChildAt(index: number): Container;
    remove(): void;
    removeChildren(): void;
    contains(child: Container): boolean;
    find(name: string): Container | null;
    _setParent(value: Container | null): void;
}

const logicMap = new WeakMap<Container, ContainerLogic>();

/**
 * 获取 Container 的逻辑处理输出。
 *
 * 使用 WeakMap 缓存，同一 Container 始终返回同一组行为函数。
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
    // ---- hierarchy management ----

    function addChild(child: Container): Container
    {
        if (!child) return child;

        const r_container = reactive(container);

        if (reactive(child).parent === container)
        {
            // 已是子对象，移动到最后
            const children = r_container.children;
            const childIndex = children.indexOf(child);
            if (childIndex !== -1) children.splice(childIndex, 1);
            children.push(child);
        }
        else
        {
            // 检查循环引用
            if (contains(child) && containerLogic(child).contains(container))
            {
                console.error('无法添加到自身中!');
                return child;
            }
            // 从旧父级移除
            const oldParent = reactive(child).parent as Container;
            if (oldParent) containerLogic(oldParent).removeChild(child);
            // 设置新父级
            containerLogic(child)._setParent(container);
            r_container.children.push(child);
        }

        return child;
    }

    function removeChild(child: Container): void
    {
        if (!child) return;
        const children = reactive(container).children;
        const childIndex = children.indexOf(child);
        if (childIndex !== -1)
        {
            children.splice(childIndex, 1);
            containerLogic(child)._setParent(null);
        }
    }

    function removeChildAt(index: number): Container
    {
        const child = container.children[index];
        reactive(container).children.splice(index, 1);
        containerLogic(child)._setParent(null);

        return child;
    }

    function remove(): void
    {
        const parent = container.parent;
        if (parent) containerLogic(parent).removeChild(container);
    }

    function removeChildren(): void
    {
        const numCh = container.children.length;
        for (let i = numCh - 1; i >= 0; i--)
        {
            removeChildAt(i);
        }
    }

    function contains(child: Container): boolean
    {
        let checkitem: Container | null = child;
        do
        {
            if (checkitem === container) return true;
            checkitem = reactive(checkitem).parent as Container;
        } while (checkitem);

        return false;
    }

    function find(name: string): Container | null
    {
        // name 在 Container 上暂无，由 Object3D 提供
        // TODO: 如果 Container 不含 name，find 应由上层实现
        return null;
    }

    // ---- internal ----

    function _setParent(value: Container | null): void
    {
        reactive(container).parent = value;
    }

    return {
        addChild,
        removeChild,
        removeChildAt,
        remove,
        removeChildren,
        contains,
        find,
        _setParent,
    };
}
