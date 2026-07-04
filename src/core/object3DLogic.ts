import { Constructor, gPartial } from '@feng3d/polyfill';
import { effect, reactive, toRaw } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { Component } from '../component/Component';
import { Renderable } from './Renderable';
import { Scene } from '../scene/Scene';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { ScriptComponent } from './ScriptComponent';
import { BoundingBox } from './BoundingBox';
import { Feng3dObject } from './Feng3dObject';
import { Object3D } from './Object3D';
import { containerLogic } from './containerLogic';

/**
 * Object3D 逻辑处理输出。
 *
 * 包含组件管理、层级管理、激活状态、包围盒、加载状态等行为函数。
 * 所有响应式依赖封装在 object3DLogic 闭包内。
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 reactive(object3D) 的属性建立响应式依赖
 * 2. 修改 — 写入 reactive(object3D) 的属性触发响应式更新
 * 3. 传递 — 传递原始对象（非响应式对象）给其他函数
 *
 * 组件操作直接使用 `reactive(object3D).components`；
 * 层级操作委托给 `containerLogic(object3D)`。
 */
export interface Object3DLogic
{
    // ---- component management ----
    addComponent<T extends Component>(Type: Constructor<T>): T;
    getComponent<T extends Component>(type: Constructor<T>): T;
    getComponentInChildren<T extends Component>(type: Constructor<T>, includeInactive?: boolean): T;
    getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive?: boolean): T;
    getComponents<T extends Component>(type?: Constructor<T>, results?: T[]): T[];
    getComponentsInChildren<T extends Component>(type?: Constructor<T>, includeInactive?: boolean, results?: T[]): T[];
    getComponentsInParent<T extends Component>(type?: Constructor<T>, includeInactive?: boolean, results?: T[]): T[];
    removeComponent(component: Component): void;
    removeComponentAt(index: number): Component;
    removeComponentsByType<T extends Component>(type: Constructor<T>): T[];
    hasComponent(component: Component): boolean;
    getComponentAt(index: number): Component;
    getComponentIndex(component: Component): number;
    setComponentIndex(component: Component, index: number): void;
    setComponentAt(component: Component, index: number): void;
    swapComponentsAt(index1: number, index2: number): void;
    swapComponents(a: Component, b: Component): void;
    addComponentAt(component: Component, index: number): void;
    addScript(scriptName: string): ScriptComponent;
    readonly numComponents: number;

    // ---- hierarchy management ----
    addChild(child: Object3D): Object3D;
    addChildren(...children: Object3D[]): void;
    removeChild(child: Object3D): void;
    removeChildAt(index: number): Object3D;
    remove(): void;
    removeChildren(): void;
    contains(child: Object3D): boolean;
    find(name: string): Object3D | null;
    getChildAt(index: number): Object3D;
    getChildren(): Object3D[];
    readonly numChildren: number;

    // ---- active state ----
    setActive(value: boolean): void;
    readonly activeInHierarchy: boolean;

    // ---- bounding box ----
    readonly boundingBox: BoundingBox;

    // ---- load state ----
    readonly isSelfLoaded: boolean;
    onSelfLoadCompleted(callback: () => void): void;
    readonly isLoaded: boolean;
    onLoadCompleted(callback: () => void): void;

    // ---- lifecycle ----
    dispose(): void;
    disposeWithChildren(): void;
}

const logicMap = new WeakMap<Object3D, Object3DLogic>();

/**
 * 获取 Object3D 的逻辑处理输出。
 *
 * 使用 WeakMap 缓存，同一 Object3D 始终返回同一组行为函数。
 */
export function object3DLogic(object3D: Object3D): Object3DLogic
{
    let logic = logicMap.get(object3D);
    if (logic) return logic;

    logic = createObject3DLogic(object3D);
    logicMap.set(object3D, logic);

    return logic;
}

function createObject3DLogic(object3D: Object3D): Object3DLogic
{
    // ---- cached lazy values ----
    let boundingBox: BoundingBox | null = null;

    // ---- helpers ----

    /**
     * 读取 object3D 的组件列表（建立响应式依赖）。
     */
    function getComponentsArray(): Component[]
    {
        return reactive(object3D).components as unknown as Component[];
    }

    /**
     * 读取子对象列表（运行期为 Object3D[]，Container 静态类型为 Container[]，需类型收窄）。
     */
    function childrenOf(): Object3D[]
    {
        return reactive(object3D).children as unknown as Object3D[];
    }

    /**
     * 读取父对象（运行期为 Object3D | null）。
     */
    function parentOf(): Object3D | null
    {
        return reactive(object3D).parent as unknown as Object3D | null;
    }

    // ---- 响应式同步：parent 变化时联动 scene 与 transform.parent ----
    effect(() =>
    {
        const parent = parentOf();
        // 同步 transform.parent
        reactive(object3D.transform).parent = parent ? parent.transform : null;
        // 派生 scene
        const newScene = parent ? parent.scene : null;
        reactive(object3D).scene = newScene;
    });

    // ---- component management ----

    function addComponentAt(component: Component | null, index: number): void
    {
        if (!component) return;
        const components = getComponentsArray();
        console.assert(index >= 0 && index <= components.length, '给出索引超出范围');

        if (hasComponent(component))
        {
            index = Math.min(index, components.length - 1);
            setComponentIndex(component, index);

            return;
        }
        // 组件唯一时移除同类型的组件
        if (component.single)
        {
            removeComponentsByType(toRaw(component).constructor as Constructor<Component>);
        }

        components.splice(index, 0, component);
        // Component 仍为带行为类，使用其 setObject3D 方法关联所属对象
        component.setObject3D(object3D);
        component.init();
    }

    function addComponent<T extends Component>(Type: Constructor<T>): T
    {
        let component = getComponent(Type);
        if (component && Component.isSingleComponent(Type))
        {
            return component;
        }
        const dependencies = Component.getDependencies(Type);
        // 先添加依赖
        dependencies.forEach((dependency) =>
        {
            addComponent(dependency);
        });

        component = new Type();
        addComponentAt(component, getComponentsArray().length);

        return component;
    }

    function getComponent<T extends Component>(type: Constructor<T>): T
    {
        const components = object3D.components;
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
        if (component)
        {
            return component;
        }

        const children = childrenOf();
        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];
            if (!includeInactive && !child.activeSelf) continue;
            const compnent = object3DLogic(child).getComponentInChildren(type, includeInactive);
            if (compnent)
            {
                return compnent;
            }
        }

        return null;
    }

    function getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        if (includeInactive || object3D.activeSelf)
        {
            const component = getComponent(type);
            if (component)
            {
                return component;
            }
        }

        const parent = parentOf();
        if (parent)
        {
            const component = object3DLogic(parent).getComponentInParent(type, includeInactive);
            if (component)
            {
                return component;
            }
        }

        return null;
    }

    function getComponents<T extends Component = Component>(type?: Constructor<T>, results: T[] = []): T[]
    {
        const components = object3D.components;
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

    function getComponentsInChildren<T extends Component = Component>(type?: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        getComponents(type, results);

        const children = childrenOf();
        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];
            if (!includeInactive && !child.activeSelf) continue;
            object3DLogic(child).getComponentsInChildren(type, includeInactive, results);
        }

        return results;
    }

    function getComponentsInParent<T extends Component = Component>(type?: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        if (includeInactive || object3D.activeSelf)
        {
            getComponents(type, results);
        }

        const parent = parentOf();
        if (parent)
        {
            object3DLogic(parent).getComponentsInParent(type, includeInactive, results);
        }

        return results;
    }

    function getComponentAt(index: number): Component
    {
        console.assert(index < object3D.components.length, '给出索引超出范围');

        return object3D.components[index];
    }

    function getComponentIndex(component: Component): number
    {
        const components = getComponentsArray();
        console.assert(components.indexOf(component) !== -1, '组件不在容器中');

        return components.indexOf(component);
    }

    function setComponentIndex(component: Component, index: number): void
    {
        const components = getComponentsArray();
        console.assert(index >= 0 && index < components.length, '给出索引超出范围');

        const oldIndex = components.indexOf(component);
        console.assert(oldIndex >= 0 && oldIndex < components.length, '子组件不在容器内');

        components.splice(oldIndex, 1);
        components.splice(index, 0, component);
    }

    function setComponentAt(component: Component, index: number): void
    {
        const components = getComponentsArray();
        if (components[index])
        {
            removeComponentAt(index);
        }
        addComponentAt(component, index);
    }

    function removeComponent(component: Component): void
    {
        console.assert(hasComponent(component), '只能移除在容器中的组件');

        const index = getComponentIndex(component);
        removeComponentAt(index);
    }

    function removeComponentAt(index: number): Component
    {
        const components = getComponentsArray();
        console.assert(index >= 0 && index < components.length, '给出索引超出范围');

        const component: Component = components.splice(index, 1)[0];
        component.dispose();

        return component;
    }

    function removeComponentsByType<T extends Component>(type: Constructor<T>): T[]
    {
        const components = getComponentsArray();
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

    function swapComponentsAt(index1: number, index2: number): void
    {
        const components = getComponentsArray();
        console.assert(index1 >= 0 && index1 < components.length, '第一个子组件的索引位置超出范围');
        console.assert(index2 >= 0 && index2 < components.length, '第二个子组件的索引位置超出范围');

        const temp: Component = components[index1];
        components[index1] = components[index2];
        components[index2] = temp;
    }

    function swapComponents(a: Component, b: Component): void
    {
        console.assert(hasComponent(a), '第一个子组件不在容器中');
        console.assert(hasComponent(b), '第二个子组件不在容器中');

        swapComponentsAt(getComponentIndex(a), getComponentIndex(b));
    }

    function hasComponent(component: Component): boolean
    {
        return getComponentsArray().indexOf(component) !== -1;
    }

    function addScript(scriptName: string): ScriptComponent
    {
        const scriptComponent = new ScriptComponent();
        scriptComponent.scriptName = scriptName;
        addComponentAt(scriptComponent, getComponentsArray().length);

        return scriptComponent;
    }

    // ---- hierarchy management (委托 containerLogic) ----

    function addChild(child: Object3D): Object3D
    {
        return containerLogic(object3D).addChild(child) as Object3D;
    }

    function addChildren(...children: Object3D[]): void
    {
        for (const child of children)
        {
            addChild(child);
        }
    }

    function removeChild(child: Object3D): void
    {
        containerLogic(object3D).removeChild(child);
    }

    function removeChildAt(index: number): Object3D
    {
        return containerLogic(object3D).removeChildAt(index) as Object3D;
    }

    function remove(): void
    {
        containerLogic(object3D).remove();
    }

    function removeChildren(): void
    {
        containerLogic(object3D).removeChildren();
    }

    function contains(child: Object3D): boolean
    {
        return containerLogic(object3D).contains(child);
    }

    function find(name: string): Object3D | null
    {
        // 优先自身匹配
        const reactiveName = reactive(object3D).name;
        if (reactiveName === name)
        {
            return object3D;
        }
        const children = childrenOf();
        for (let i = 0; i < children.length; i++)
        {
            const target = object3DLogic(children[i]).find(name);
            if (target)
            {
                return target;
            }
        }

        return null;
    }

    function getChildAt(index: number): Object3D
    {
        return childrenOf()[index];
    }

    function getChildren(): Object3D[]
    {
        return childrenOf().slice();
    }

    // ---- active state ----

    function setActive(value: boolean): void
    {
        reactive(object3D).activeSelf = value;
    }

    function getActiveInHierarchy(): boolean
    {
        let activeSelf = object3D.activeSelf;
        const parent = parentOf();
        if (parent)
        {
            activeSelf = activeSelf && object3DLogic(parent).activeInHierarchy;
        }

        return activeSelf;
    }

    // ---- bounding box ----

    function getBoundingBox(): BoundingBox
    {
        if (!boundingBox)
        {
            boundingBox = new BoundingBox(object3D);
        }

        return boundingBox;
    }

    // ---- load state ----

    function getIsSelfLoaded(): boolean
    {
        const model = getComponent(Renderable);
        if (model) return (model as any).isLoaded;

        return true;
    }

    function onSelfLoadCompleted(callback: () => void): void
    {
        if (getIsSelfLoaded())
        {
            callback();

            return;
        }
        const model = getComponent(Renderable);
        if (model)
        {
            (model as any).onLoadCompleted(callback);
        }
        else callback();
    }

    function getIsLoaded(): boolean
    {
        if (!getIsSelfLoaded()) return false;
        const children = childrenOf();
        for (let i = 0; i < children.length; i++)
        {
            if (!object3DLogic(children[i]).isLoaded) return false;
        }

        return true;
    }

    function onLoadCompleted(callback: () => void): void
    {
        let loadingNum = 0;
        if (!getIsSelfLoaded())
        {
            loadingNum++;
            onSelfLoadCompleted(() =>
            {
                loadingNum--;
                if (loadingNum === 0) callback();
            });
        }
        const children = childrenOf();
        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];
            if (!object3DLogic(child).isLoaded)
            {
                loadingNum++;
                object3DLogic(child).onLoadCompleted(() =>
                {
                    loadingNum--;
                    if (loadingNum === 0) callback();
                });
            }
        }
        if (loadingNum === 0) callback();
    }

    // ---- lifecycle ----

    function dispose(): void
    {
        // 从父级移除
        remove();
        // 移除所有子对象
        const childrenLen = childrenOf().length;
        for (let i = childrenLen - 1; i >= 0; i--)
        {
            removeChildAt(i);
        }
        // 移除所有组件
        const componentsLen = object3D.components.length;
        for (let i = componentsLen - 1; i >= 0; i--)
        {
            removeComponentAt(i);
        }
        logicMap.delete(object3D);
    }

    function disposeWithChildren(): void
    {
        dispose();
        while (childrenOf().length > 0)
        {
            object3DLogic(getChildAt(0)).dispose();
        }
    }

    return {
        addComponent,
        getComponent,
        getComponentInChildren,
        getComponentInParent,
        getComponents,
        getComponentsInChildren,
        getComponentsInParent,
        removeComponent,
        removeComponentAt,
        removeComponentsByType,
        hasComponent,
        getComponentAt,
        getComponentIndex,
        setComponentIndex,
        setComponentAt,
        swapComponentsAt,
        swapComponents,
        addComponentAt,
        addScript,
        get numComponents() { return object3D.components.length; },

        addChild,
        addChildren,
        removeChild,
        removeChildAt,
        remove,
        removeChildren,
        contains,
        find,
        getChildAt,
        getChildren,
        get numChildren() { return childrenOf().length; },

        setActive,
        get activeInHierarchy() { return getActiveInHierarchy(); },

        get boundingBox() { return getBoundingBox(); },

        get isSelfLoaded() { return getIsSelfLoaded(); },
        onSelfLoadCompleted,
        get isLoaded() { return getIsLoaded(); },
        onLoadCompleted,

        dispose,
        disposeWithChildren,
    };
}

// ------------------------------------------
// 原始游戏对象工厂方法（独立函数 + Object3D 静态别名）
// ------------------------------------------

/**
 * 已注册的原始游戏对象构造函数表。
 */
const _registerPrimitives: { [type: string]: (object3D: Object3D) => void } = {};

/**
 * 创建指定类型的游戏对象。
 *
 * @param type 游戏对象类型。
 * @param param 游戏对象参数。
 */
export function createPrimitive<K extends keyof PrimitiveObject3D>(type: K, param?: gPartial<Object3D>): Object3D
{
    const g = new Object3D();
    reactive(g).name = type;

    const createHandler = _registerPrimitives[type];
    if (createHandler) createHandler(g);

    serialization.setValue(g, param);

    return g;
}

/**
 * 注册原始游戏对象，被注册后可以使用 {@link createPrimitive} 进行创建。
 *
 * @param type 原始游戏对象类型。
 * @param handler 构建原始游戏对象的函数。
 */
export function registerPrimitive<K extends keyof PrimitiveObject3D>(type: K, handler: (object3D: Object3D) => void): void
{
    if (_registerPrimitives[type])
    {
        console.warn(`重复注册原始游戏对象 ${type} ！`);
    }
    _registerPrimitives[type] = handler;
}

/**
 * 查找指定名称的游戏对象。
 *
 * 注意：Object3D 已转为纯数据结构（不再继承 Feng3dObject），
 * 全局实例注册表追踪待后续迁移至独立的 Object3D 注册中心。
 * 当前实现仍尝试从 Feng3dObject.objectLib 中过滤，兼容尚未迁移的旧实例。
 *
 * @param name 对象名称
 */
export function findObject3D(name: string): Object3D | undefined
{
    // Object3D 不再继承 Feng3dObject，使用 unknown 中转以避开类型约束
    const object3Ds = (Feng3dObject.getObjects() as unknown[]).filter((v): v is Object3D =>
        v instanceof Object3D);
    const result = object3Ds.filter((v) => (v.name === name));

    return result[0];
}

/**
 * 原始游戏对象，可以通过{@link createPrimitive}进行创建。
 */
export interface PrimitiveObject3D extends MixinsPrimitiveObject3D
{
}

// ------------------------------------------
// Object3D 静态别名
//
// 为保持向后兼容（30+ 处调用点使用 Object3D.createPrimitive / registerPrimitive / find），
// 将独立函数挂载为 Object3D 的静态方法。逻辑实现仍在上方独立函数中。
// ------------------------------------------
(Object3D as any).createPrimitive = createPrimitive;
(Object3D as any).registerPrimitive = registerPrimitive;
(Object3D as any).find = findObject3D;
(Object3D as any)._registerPrimitives = _registerPrimitives;

// 在 Hierarchy 界面右键创建游戏
createNodeMenu.push(
    {
        path: 'Create Empty',
        click: () =>
            new Object3D()
    },
);
