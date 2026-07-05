import { isRenderable } from "../component/Component";
import { gPartial } from '@feng3d/polyfill';
import { computed, Computed, effect, reactive, toRaw } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { Component } from '../component/Component';
import { componentLogic } from '../component/componentLogic';
import { Renderable } from './Renderable';
import { renderableLogic } from './renderableLogic';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { BoundingBox } from './BoundingBox';
import { Object3D } from './Object3D';
import { createObject3D } from './createObject3D';
import { ContainerLogic, createContainerLogic } from './containerLogic';
import { createEntityLogic } from './entityLogic';
import { logic, registerLogic } from './logic';

/**
 * Object3D 逻辑处理输出。
 *
 * 继承 ContainerLogic（parent 响应式字段）。内部组合 createContainerLogic
 * （parent 同步）与 createEntityLogic（组件自动初始化）。
 */
export interface Object3DLogic extends ContainerLogic
{
    readonly activeInHierarchy: Computed<boolean>;
    readonly isSelfLoaded: Computed<boolean>;
    readonly isLoaded: Computed<boolean>;
    readonly boundingBox: Computed<BoundingBox>;
    dispose(): void;
}

/**
 * 创建 Object3D 的 logic。
 *
 * 内部组合 createContainerLogic（parent 同步）与 createEntityLogic（组件自动初始化）。
 */
export function createObject3DLogic(object3D: Object3D): Object3DLogic
{
    const containerL = createContainerLogic(object3D);
    createEntityLogic(object3D);

    // ---- 响应式同步：parent 变化时联动 scene ----
    effect(() =>
    {
        const parent = containerL.parent as Object3D | null;
        const newScene = parent ? parent.scene : null;
        reactive(object3D).scene = newScene;
    });

    const activeInHierarchy = computed<boolean>(() =>
    {
        let active = reactive(object3D).activeSelf;
        const parent = containerL.parent as Object3D | null;
        if (parent)
        {
            active = active && logic<Object3DLogic>(parent).activeInHierarchy.value;
        }

        return active;
    });

    const boundingBox = computed<BoundingBox>(() => new BoundingBox(object3D));

    const isSelfLoaded = computed<boolean>(() =>
    {
        const components = object3D.components;
        for (let i = 0; i < components.length; i++)
        {
            if (isRenderable(components[i]))
            {
                return renderableLogic(components[i] as Renderable).isLoaded.value;
            }
        }

        return true;
    });

    const isLoaded = computed<boolean>(() =>
    {
        if (!isSelfLoaded.value) return false;
        const children = reactive(object3D).children as unknown as Object3D[];
        for (let i = 0; i < children.length; i++)
        {
            if (!logic<Object3DLogic>(children[i]).isLoaded.value) return false;
        }

        return true;
    });

    function dispose(): void
    {
        const parent = containerL.parent as Object3D | null;
        if (parent)
        {
            reactive(parent).children.splice(reactive(parent).children.indexOf(object3D), 1);
        }
        reactive(containerL).parent = null;
        const children = reactive(object3D).children as unknown as Object3D[];
        for (let i = children.length - 1; i >= 0; i--)
        {
            logic<Object3DLogic>(children[i]).dispose();
        }
        const r_components = reactive(object3D).components;
        for (let i = r_components.length - 1; i >= 0; i--)
        {
            const component = toRaw(r_components[i]) as unknown as Component;
            r_components.splice(i, 1);
            componentLogic(component).dispose();
        }
    }

    return {
        get parent() { return containerL.parent; },
        set parent(v) { reactive(containerL).parent = v; },
        activeInHierarchy,
        isSelfLoaded,
        isLoaded,
        boundingBox,
        dispose,
    };
}

registerLogic('Object3D', createObject3DLogic);

const _registerPrimitives: Record<string, (object3D: Object3D) => void> = {};

export function createPrimitive<K extends string>(type: K, param?: gPartial<Object3D>): Object3D
{
    const g = createObject3D();
    reactive(g).name = type as string;

    logic<Object3DLogic>(g);

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

createNodeMenu.push(
    {
        path: 'Create Empty',
        click: () =>
            createPrimitive('Create Empty' as any)
    },
);
