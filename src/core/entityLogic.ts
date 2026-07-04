import { Constructor } from '@feng3d/polyfill';
import { reactive, toRaw } from '@feng3d/reactivity';
import { Component } from '../component/Component';
import { ScriptComponent } from './ScriptComponent';
import { Entity } from './Entity';

/**
 * Entity 逻辑处理输出。
 *
 * 包含组件管理、层级管理、生命周期等行为函数。
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

    addChild(child: Entity): Entity;
    addChildren(...children: Entity[]): void;
    remove(): void;
    removeChildren(): void;
    removeChild(child: Entity): void;
    removeChildAt(index: number): Entity;
    getChildAt(index: number): Entity;
    getChildren(): Entity[];
    find(name: string): Entity;
    contains(child: Entity): boolean;

    setActive(value: boolean): void;
    get activeInHierarchy(): boolean;
    dispose(): void;
    disposeWithChildren(): void;

    get numComponents(): number;
    get numChildren(): number;

    _invalidateActiveInHierarchy(): void;
    _setParent(value: Entity | null): void;
    updateScene(): void;
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
    // ---- active hierarchy ----

    let _activeInHierarchy = false;
    let _activeInHierarchyInvalid = true;

    function _updateActiveInHierarchy()
    {
        const r_entity = reactive(entity);
        let active = r_entity.activeSelf;
        const parent = entity.parent;
        if (parent)
        {
            active = active && entityLogic(parent).activeInHierarchy;
        }
        _activeInHierarchy = active;
    }

    function _invalidateActiveInHierarchy()
    {
        if (_activeInHierarchyInvalid) return;
        _activeInHierarchyInvalid = true;
        const children = entity.children;
        for (const child of children)
        {
            entityLogic(child)._invalidateActiveInHierarchy();
        }
    }

    // ---- scene management ----

    function updateScene()
    {
        const r_entity = reactive(entity);
        const parent = entity.parent;
        const newScene = parent ? reactive(parent).scene : null;
        if (r_entity.scene === newScene) return;

        r_entity.scene = newScene;

        updateChildrenScene();
    }

    function updateChildrenScene()
    {
        const children = entity.children;
        for (const child of children)
        {
            entityLogic(child).updateScene();
        }
    }

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
        const components = reactive(entity).components;
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

        const children = entity.children;
        for (const child of children)
        {
            if (!includeInactive && !reactive(child).activeSelf) continue;
            const compnent = entityLogic(child).getComponentInChildren(type, includeInactive);
            if (compnent) return compnent;
        }

        return null;
    }

    function getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        const r_entity = reactive(entity);
        if (includeInactive || r_entity.activeSelf)
        {
            const component = getComponent(type);
            if (component) return component;
        }
        const parent = entity.parent;
        if (parent)
        {
            const component = entityLogic(parent).getComponentInParent(type, includeInactive);
            if (component) return component;
        }

        return null;
    }

    function getComponents<T extends Component = Component>(type?: Constructor<T>, results: T[] = []): T[]
    {
        const components = reactive(entity).components;
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

        const children = entity.children;
        for (const child of children)
        {
            if (!includeInactive && !reactive(child).activeSelf) continue;
            entityLogic(child).getComponentsInChildren(type, includeInactive, results);
        }

        return results;
    }

    function getComponentsInParent<T extends Component>(type?: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        const r_entity = reactive(entity);
        if (includeInactive || r_entity.activeSelf)
        {
            getComponents(type, results);
        }
        const parent = entity.parent;
        if (parent)
        {
            entityLogic(parent).getComponentsInParent(type, includeInactive, results);
        }

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
        const components = reactive(entity).components;
        if (components[index])
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
        return reactive(entity).components.indexOf(component);
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
        const components = reactive(entity).components;
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
        return reactive(entity).components.indexOf(com) !== -1;
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

    // ---- hierarchy management ----

    function find(name: string): Entity
    {
        if (reactive(entity).name === name) return entity;
        const children = entity.children;
        for (const child of children)
        {
            const target = entityLogic(child).find(name);
            if (target) return target;
        }

        return null;
    }

    function contains(child: Entity)
    {
        let checkitem: Entity | null = child;
        do
        {
            if (checkitem === entity) return true;
            checkitem = checkitem.parent;
        } while (checkitem);

        return false;
    }

    function addChild(child: Entity): Entity
    {
        if (!child) return child;

        const children = reactive(entity).children;

        if (reactive(child).parent === entity)
        {
            const childIndex = children.indexOf(child);
            if (childIndex !== -1) children.splice(childIndex, 1);
            children.push(child);
        }
        else
        {
            if (entityLogic(child).contains(entity))
            {
                console.error('无法添加到自身中!');
                return child;
            }
            const oldParent = child.parent;
            if (oldParent) entityLogic(oldParent).removeChild(child);
            entityLogic(child)._setParent(entity);
            children.push(child);
        }

        return child;
    }

    function addChildren(...childarray: Entity[])
    {
        for (const child of childarray)
        {
            addChild(child);
        }
    }

    function remove()
    {
        const parent = entity.parent;
        if (parent) entityLogic(parent).removeChild(entity);
    }

    function removeChildren()
    {
        const numCh = reactive(entity).children.length;
        for (let i = numCh - 1; i >= 0; i--)
        {
            removeChildAt(i);
        }
    }

    function removeChild(child: Entity)
    {
        if (!child) return;
        const children = reactive(entity).children;
        const childIndex = children.indexOf(child);
        if (childIndex !== -1) removeChildInternal(childIndex, child);
    }

    function removeChildAt(index: number): Entity
    {
        const child = entity.children[index];

        return removeChildInternal(index, child);
    }

    function removeChildInternal(childIndex: number, child: Entity): Entity
    {
        reactive(entity).children.splice(childIndex, 1);
        entityLogic(child)._setParent(null);

        return child;
    }

    function getChildAt(index: number): Entity
    {
        return entity.children[index];
    }

    function getChildren(): Entity[]
    {
        return entity.children.concat();
    }

    // ---- lifecycle ----

    function setActive(value: boolean)
    {
        reactive(entity).activeSelf = value;
        _invalidateActiveInHierarchy();
    }

    function dispose()
    {
        const parent = entity.parent;
        if (parent) entityLogic(parent).removeChild(entity);
        removeChildren();
        const numComp = reactive(entity).components.length;
        for (let i = numComp - 1; i >= 0; i--)
        {
            removeComponentAt(i);
        }
    }

    function disposeWithChildren()
    {
        dispose();
        while (reactive(entity).children.length > 0)
        {
            entityLogic(getChildAt(0)).dispose();
        }
    }

    // ---- _setParent ----

    function _setParent(value: Entity | null)
    {
        reactive(entity).parent = value;
        updateScene();
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

        addChild,
        addChildren,
        remove,
        removeChildren,
        removeChild,
        removeChildAt,
        getChildAt,
        getChildren,
        find,
        contains,

        setActive,
        get activeInHierarchy()
        {
            if (_activeInHierarchyInvalid)
            {
                _updateActiveInHierarchy();
                _activeInHierarchyInvalid = false;
            }

            return _activeInHierarchy;
        },
        dispose,
        disposeWithChildren,

        get numComponents() { return reactive(entity).components.length; },
        get numChildren() { return reactive(entity).children.length; },

        _invalidateActiveInHierarchy,
        _setParent,
        updateScene,
    };
}
