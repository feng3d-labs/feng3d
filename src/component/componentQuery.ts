import { Constructor } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import type { Object3D } from '../core/Object3D';
import type { Component } from './Component';

/**
 * 组件查询与增删工具函数。
 *
 * Component 为纯数据，组件管理直接操作 reactive(object3D).components。
 * 这些函数封装常见的查询/增删模式，供消费方使用。
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 reactive(object3D).components 建立响应式依赖
 * 2. 修改 — 通过 reactive(object3D).components 增删触发响应式更新
 * 3. 传递 — 传递原始对象给其他函数
 */

/**
 * 新增组件到 Object3D。
 *
 * @param object3D 目标 Object3D
 * @param type 组件类定义
 * @returns 被添加的组件
 */
export function addComponent<T extends Component>(object3D: Object3D, type: Constructor<T>): T
{
    const c = new type();
    reactive(object3D).components.push(c);

    return c;
}

/**
 * 获取 Object3D 上指定类型的第一个组件。
 */
export function getComponent<T extends Component>(object3D: Object3D, type: Constructor<T>): T
{
    return object3D.components.find(c => c instanceof type) as T;
}

/**
 * 获取 Object3D 上所有匹配类型的组件。
 */
export function getComponents<T extends Component>(object3D: Object3D, type: Constructor<T>, results: T[] = []): T[]
{
    for (const c of object3D.components)
    {
        if (!type || c instanceof type) results.push(c as T);
    }

    return results;
}

/**
 * 在自身及子孙中查找指定类型的第一个组件。
 *
 * @param object3D 起始对象
 * @param type 组件类定义
 * @param includeInactive 是否包含未激活对象
 */
export function getComponentInChildren<T extends Component>(object3D: Object3D, type: Constructor<T>, includeInactive = false): T
{
    const component = getComponent(object3D, type);
    if (component) return component;

    const r_children = reactive(object3D).children as unknown as Object3D[];
    for (const r_child of r_children)
    {
        const child = r_child as unknown as Object3D;
        if (!includeInactive && !child.activeSelf) continue;
        const found = child.components.find(c => c instanceof type) as T;
        if (found) return found;
        const sub = getComponentInChildren(child, type, includeInactive);
        if (sub) return sub;
    }

    return null;
}

/**
 * 在自身及子孙中查找所有匹配类型的组件。
 */
export function getComponentsInChildren<T extends Component>(object3D: Object3D, type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
{
    getComponents(object3D, type, results);

    const r_children = reactive(object3D).children as unknown as Object3D[];
    for (const r_child of r_children)
    {
        const child = r_child as unknown as Object3D;
        if (!includeInactive && !child.activeSelf) continue;
        for (const c of child.components)
        {
            if (!type || c instanceof type) results.push(c as T);
        }
        getComponentsInChildren(child, type, includeInactive, results);
    }

    return results;
}

/**
 * 在自身及父级中查找指定类型的第一个组件。
 */
export function getComponentInParent<T extends Component>(object3D: Object3D, type: Constructor<T>, includeInactive = false): T
{
    if (includeInactive || object3D.activeSelf)
    {
        const component = getComponent(object3D, type);
        if (component) return component;
    }
    let r_parent = reactive(object3D).parent as unknown as Object3D | null;
    while (r_parent)
    {
        const parent = r_parent as unknown as Object3D;
        if (includeInactive || parent.activeSelf)
        {
            const c = parent.components.find(c => c instanceof type) as T;
            if (c) return c;
        }
        r_parent = reactive(parent).parent as unknown as Object3D | null;
    }

    return null;
}

/**
 * 在自身及父级中查找所有匹配类型的组件。
 */
export function getComponentsInParent<T extends Component>(object3D: Object3D, type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
{
    if (includeInactive || object3D.activeSelf)
    {
        getComponents(object3D, type, results);
    }
    let r_parent = reactive(object3D).parent as unknown as Object3D | null;
    while (r_parent)
    {
        const parent = r_parent as unknown as Object3D;
        if (includeInactive || parent.activeSelf)
        {
            for (const c of parent.components)
            {
                if (!type || c instanceof type) results.push(c as T);
            }
        }
        r_parent = reactive(parent).parent as unknown as Object3D | null;
    }

    return results;
}
