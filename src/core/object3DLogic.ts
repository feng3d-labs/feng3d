import { gPartial } from '@feng3d/polyfill';
import { effect, reactive, toRaw } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { Component, _setObject3DLogic } from '../component/Component';
import { Renderable } from './Renderable';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { BoundingBox } from './BoundingBox';
import { Feng3dObject } from './Feng3dObject';
import { Object3D } from './Object3D';
import { containerLogic } from './containerLogic';
import { entityLogic } from './entityLogic';

/**
 * Object3D 逻辑处理输出。
 *
 * 包含激活状态、包围盒、加载状态、生命周期等行为函数。
 * 组件操作直接使用 reactive(object3D).components。
 * 子级操作直接使用 reactive(object3D).children。
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 reactive(object3D) 的属性建立响应式依赖
 * 2. 修改 — 写入 reactive(object3D) 的属性触发响应式更新
 * 3. 传递 — 传递原始对象（非响应式对象）给其他函数
 */
export interface Object3DLogic
{
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
    // 触发 entityLogic（注册组件自动初始化 effect）
    entityLogic(object3D);
    // 触发 containerLogic（注册子级自动同步 parent effect）
    containerLogic(object3D);

    let boundingBox: BoundingBox | null = null;

    function parentOf(): Object3D | null
    {
        return reactive(object3D).parent as unknown as Object3D | null;
    }

    function childrenOf(): Object3D[]
    {
        return reactive(object3D).children as unknown as Object3D[];
    }

    // ---- 响应式同步：parent 变化时联动 scene ----
    effect(() =>
    {
        const parent = parentOf();
        const newScene = parent ? parent.scene : null;
        reactive(object3D).scene = newScene;
    });

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
        const components = object3D.components;
        for (let i = 0; i < components.length; i++)
        {
            if (components[i] instanceof Renderable)
            {
                return (components[i] as any).isLoaded;
            }
        }

        return true;
    }

    function onSelfLoadCompleted(callback: () => void): void
    {
        if (getIsSelfLoaded())
        {
            callback();

            return;
        }
        const components = object3D.components;
        for (let i = 0; i < components.length; i++)
        {
            if (components[i] instanceof Renderable)
            {
                (components[i] as any).onLoadCompleted(callback);

                return;
            }
        }
        callback();
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
        // 从父级 children 数组中移除
        const parent = object3D.parent as Object3D | null;
        if (parent)
        {
            reactive(parent).children.splice(reactive(parent).children.indexOf(object3D), 1);
        }
        // 移除所有子对象
        const children = childrenOf();
        for (let i = children.length - 1; i >= 0; i--)
        {
            object3DLogic(children[i]).dispose();
        }
        // 移除所有组件
        const r_components = reactive(object3D).components;
        for (let i = r_components.length - 1; i >= 0; i--)
        {
            const component = r_components[i];
            r_components.splice(i, 1);
            component.dispose();
        }
        logicMap.delete(object3D);
    }

    function disposeWithChildren(): void
    {
        dispose();
    }

    return {
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

// 绑定 object3DLogic 到 Component（打破循环依赖）
_setObject3DLogic(object3DLogic);

// ------------------------------------------
// 工厂方法
// ------------------------------------------

const _registerPrimitives: Record<string, (object3D: Object3D) => void> = {};

export function createPrimitive<K extends string>(type: K, param?: gPartial<Object3D>): Object3D
{
    const g = new Object3D();
    reactive(g).name = type as string;

    const handler = _registerPrimitives[type as string];
    if (handler) handler(g);

    if (param) serialization.setValue(g, param);

    return g;
}

export function registerPrimitive<K extends string>(type: K, handler: (object3D: Object3D) => void): void
{
    if (_registerPrimitives[type as string])
    {
        console.warn(`重复注册原始对象 ${type} ！`);
    }
    _registerPrimitives[type as string] = handler;
}

export function findObject3D(name: string): Object3D | undefined
{
    const objects = Feng3dObject.getObjects(Object3D as any);
    const result = objects.filter((v) => !v.disposed && (v.name === name));

    return result[0] as unknown as Object3D | undefined;
}

/**
 * 在 object3D 的子级中递归查找指定名称的对象。
 * @param object3D 父级对象
 * @param name 子级名称
 */
export function findObject3DChild(object3D: Object3D, name: string): Object3D | undefined
{
    const children = reactive(object3D).children as unknown as Object3D[];
    for (let i = 0; i < children.length; i++)
    {
        const child = children[i];
        if (child.name === name) return child;
    }
    for (let i = 0; i < children.length; i++)
    {
        const found = findObject3DChild(children[i], name);
        if (found) return found;
    }

    return undefined;
}

// 在 Hierarchy 界面右键创建游戏
createNodeMenu.push(
    {
        path: 'Create Empty',
        click: () =>
            new Object3D()
    },
);
