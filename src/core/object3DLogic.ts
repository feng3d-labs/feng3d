import { Constructor, gPartial } from '@feng3d/polyfill';
import { effect, reactive, toRaw } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { Component, _setObject3DLogic } from '../component/Component';
import { Renderable } from './Renderable';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { BoundingBox } from './BoundingBox';
import { Feng3dObject } from './Feng3dObject';
import { Object3D } from './Object3D';
import { containerLogic } from './containerLogic';

/**
 * Object3D 逻辑处理输出。
 *
 * 包含层级管理、激活状态、包围盒、加载状态、生命周期等行为函数。
 * 组件操作直接使用 reactive(object3D).components。
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 reactive(object3D) 的属性建立响应式依赖
 * 2. 修改 — 写入 reactive(object3D) 的属性触发响应式更新
 * 3. 传递 — 传递原始对象（非响应式对象）给其他函数
 */
export interface Object3DLogic
{
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
    let boundingBox: BoundingBox | null = null;

    function childrenOf(): Object3D[]
    {
        return reactive(object3D).children as unknown as Object3D[];
    }

    function parentOf(): Object3D | null
    {
        return reactive(object3D).parent as unknown as Object3D | null;
    }

    // ---- 响应式同步：parent 变化时联动 scene ----
    effect(() =>
    {
        const parent = parentOf();
        const newScene = parent ? parent.scene : null;
        reactive(object3D).scene = newScene;
    });

    // ---- hierarchy management ----

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
        if (reactive(object3D).name === name)
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
        remove();
        const childrenLen = childrenOf().length;
        for (let i = childrenLen - 1; i >= 0; i--)
        {
            removeChildAt(i);
        }
        const components = reactive(object3D).components;
        for (let i = components.length - 1; i >= 0; i--)
        {
            const component = components[i];
            components.splice(i, 1);
            component.dispose();
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

// 在 Hierarchy 界面右键创建游戏
createNodeMenu.push(
    {
        path: 'Create Empty',
        click: () =>
            new Object3D()
    },
);
