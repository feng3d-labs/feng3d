import { Constructor } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { Component } from '../component/Component';
import { ScriptComponent } from './ScriptComponent';
import { Entity } from './Entity';

/**
 * Entity 逻辑处理输出。
 *
 * 包含组件管理等行为函数。
 * 所有响应式依赖封装在 entityLogic 闭包内。
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 reactive(entity) 的属性建立响应式依赖
 * 2. 修改 — 写入 reactive(entity) 的属性触发响应式更新
 * 3. 传递 — 传递原始对象（非响应式对象）给其他函数
 */
export interface EntityLogic
{
    addComponent<T extends Component>(Type: Constructor<T>): T;
    getComponent<T extends Component>(type: Constructor<T>): T;
    getComponentInChildren<T extends Component>(type: Constructor<T>, includeInactive?: boolean): T;
    getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive?: boolean): T;
    getComponents<T extends Component = Component>(type?: Constructor<T>, results?: T[]): T[];
    getComponentsInChildren<T extends Component>(type?: Constructor<T>, includeInactive?: boolean, results?: T[]): T[];
    getComponentsInParent<T extends Component>(type?: Constructor<T>, includeInactive?: boolean, results?: T[]): T[];
    getComponentAt(index: number): Component;
    setComponentIndex(component: Component, index: number): void;
    setComponentAt(component: Component, index: number): void;
    removeComponent(component: Component): void;
    getComponentIndex(component: Component): number;
    removeComponentAt(index: number): Component;
    swapComponentsAt(index1: number, index2: number): void;
    swapComponents(a: Component, b: Component): void;
    removeComponentsByType<T extends Component>(type: Constructor<T>): T[];
    addComponentAt(component: Component, index: number): void;
    hasComponent(com: Component): boolean;
    addScript(scriptName: string): ScriptComponent;

    get numComponents(): number;
}

const logicMap = new WeakMap<Entity, EntityLogic>();

/**
 * 获取 Entity 的逻辑处理输出。
 *
 * 使用 WeakMap 缓存，同一 Entity 始终返回同一组行为函数。
 */
export function entityLogic(entity: Entity): EntityLogic
{
    let logic = logicMap.get(entity);
    if (logic) return logic;

    logic = createEntityLogic(entity);
    logicMap.set(entity, logic);

    return logic;
}

function createEntityLogic(entity: Entity): EntityLogic
{
    // ---- component management ----

    function addComponent<T extends Component>(Type: Constructor<T>): T
    {
        let component = getComponent(Type);
        if (component && Component.isSingleComponent(Type))
        {
            return component;
        }
        const dependencies = Component.getDependencies(Type);
        dependencies.forEach((dependency) =>
        {
            addComponent(dependency);
        });
        component = new Type();
        addComponentAt(component, reactive(entity).components.length);

        return component;
    }

    function getComponent<T extends Component>(type: Constructor<T>): T
    {
        const components = entity.components;
        for (let i = 0; i < components.length; i++)
        {
            if (components[i] instanceof type)
            {
                return components[i] as T;
            }
        }

        return null;
    }

    function getComponentInChildren<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        const component = getComponent(type);
        if (component) return component;

        // 层级遍历由 GameObject 提供，这里仅查自身
        // TODO: 后续 GameObject 适配后通过 gameObject.children 遍历

        return null;
    }

    function getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        const component = getComponent(type);
        if (component) return component;
        // 层级遍历由 GameObject 提供

        return null;
    }

    function getComponents<T extends Component = Component>(type?: Constructor<T>, results: T[] = []): T[]
    {
        const components = entity.components;
        for (let i = 0; i < components.length; i++)
        {
            const component = components[i];
            if (!type || component instanceof type)
            {
                results.push(component as any);
            }
        }

        return results;
    }

    function getComponentsInChildren<T extends Component>(type?: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        getComponents(type, results);
        // 层级遍历由 GameObject 提供

        return results;
    }

    function getComponentsInParent<T extends Component>(type?: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        getComponents(type, results);
        // 层级遍历由 GameObject 提供

        return results;
    }

    function getComponentAt(index: number): Component
    {
        return entity.components[index];
    }

    function setComponentIndex(component: Component, index: number): void
    {
        const components = reactive(entity).components;
        const oldIndex = components.indexOf(component);
        components.splice(oldIndex, 1);
        components.splice(index, 0, component);
    }

    function setComponentAt(component: Component, index: number)
    {
        if (entity.components[index])
        {
            removeComponentAt(index);
        }
        addComponentAt(component, index);
    }

    function removeComponent(component: Component): void
    {
        const index = getComponentIndex(component);
        removeComponentAt(index);
    }

    function getComponentIndex(component: Component): number
    {
        return entity.components.indexOf(component);
    }

    function removeComponentAt(index: number): Component
    {
        const component = entity.components[index];
        reactive(entity).components.splice(index, 1);
        component.dispose();

        return component;
    }

    function swapComponentsAt(index1: number, index2: number): void
    {
        const components = reactive(entity).components;
        const temp = components[index1];
        components[index1] = components[index2];
        components[index2] = temp;
    }

    function swapComponents(a: Component, b: Component): void
    {
        swapComponentsAt(getComponentIndex(a), getComponentIndex(b));
    }

    function removeComponentsByType<T extends Component>(type: Constructor<T>)
    {
        const components = entity.components;
        const removeComponents: T[] = [];
        for (let i = components.length - 1; i >= 0; i--)
        {
            if (components[i].constructor === type)
            {
                removeComponents.push(removeComponentAt(i) as T);
            }
        }

        return removeComponents;
    }

    function hasComponent(com: Component): boolean
    {
        return entity.components.indexOf(com) !== -1;
    }

    function addComponentAt(component: Component, index: number): void
    {
        if (!component) return;

        const components = reactive(entity).components;

        if (hasComponent(component))
        {
            index = Math.min(index, components.length - 1);
            setComponentIndex(component, index);
            return;
        }
        if (component.single)
        {
            removeComponentsByType(component.constructor as Constructor<Component>);
        }

        components.splice(index, 0, component);
        // TODO: Component 阶段3纯数据化后，gameObject 类型将变为 Entity，移除 as any
        (reactive(component) as any).gameObject = entity;
        component.init();
    }

    function addScript(scriptName: string)
    {
        const scriptComponent = new ScriptComponent();
        scriptComponent.scriptName = scriptName;
        addComponentAt(scriptComponent, reactive(entity).components.length);

        return scriptComponent;
    }

    return {
        addComponent,
        getComponent,
        getComponentInChildren,
        getComponentInParent,
        getComponents,
        getComponentsInChildren,
        getComponentsInParent,
        getComponentAt,
        setComponentIndex,
        setComponentAt,
        removeComponent,
        getComponentIndex,
        removeComponentAt,
        swapComponentsAt,
        swapComponents,
        removeComponentsByType,
        addComponentAt,
        hasComponent,
        addScript,

        get numComponents() { return entity.components.length; },
    };
}
