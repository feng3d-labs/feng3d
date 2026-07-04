import { IEvent } from '@feng3d/event';
import { Constructor, IDisposable } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { RenderObject } from '@feng3d/webgpu';
import { Camera } from '../cameras/Camera';
import { Feng3dObject } from '../core/Feng3dObject';
import type { Object3D, Object3DEventMap } from '../core/Object3D';
import { Scene } from '../scene/Scene';

// object3DLogic 延迟绑定，避免循环依赖（Component ← object3DLogic ← Component）
// object3DLogic.ts 底部会调用 _setObject3DLogic 绑定
let _object3DLogic: (obj: Object3D) => any;
export function _setObject3DLogic(fn: typeof _object3DLogic)
{
    _object3DLogic = fn;
}

declare global
{
    interface MixinsComponentMap { }
    interface MixinsComponent { }
}

interface ComponentInfo
{
    /**
     * 组件名称，默认构造函数名称。当组件重名时可以使用该参数进行取别名，并且在接口 ComponentMap 中相应调整。
     */
    name: string;
    /**
     * 是否唯一，同类型组件只允许一个。
     */
    single: boolean;
    /**
     * 构造函数
     */
    type: Constructor<Component>;
    /**
     * 所依赖的组件列表。当该组件被添加Entity上时，会补齐缺少的依赖组件。
     */
    dependencies: Constructor<Component>[];
}

/**
 * 组件信息属性常量，保存组件名称与组件依赖ComponentInfo，由 @RegisterComponent 装饰器进行填充。
 */
const __component__ = '__component__';

/**
 * 注册组件
 *
 * 使用 @RegisterComponent 在组件类定义上注册组件，配合扩展 ComponentMap 接口后可使用 Object3D.getComponent 等方法。
 *
 * @param component 组件名称，默认使用类名称
 */
export function RegisterComponent(component?: {
    /**
     * 组件名称，默认构造函数名称。当组件重名时可以使用该参数进行取别名，并且在接口 ComponentMap 中相应调整。
     */
    name: string,
    /**
     * 是否唯一，同类型组件只允许一个。
     */
    single?: boolean,
    /**
     * 所依赖的组件列表。当该组件被添加Entity上时，会补齐缺少的依赖组件。
     */
    dependencies?: Constructor<Component>[]
})
{
    return (constructor: Constructor<Component>) =>
    {
        component = component || <any>{};
        const info = component as ComponentInfo;
        info.name = info.name || component.name || constructor.name;
        info.type = constructor;
        info.dependencies = info.dependencies || [];
        constructor.prototype[__component__] = info;

        if (Component._componentMap[info.name])
        {
            console.warn(`重复定义组件${info.name}，${Component._componentMap[info.name]} ${constructor} ！`);
        }
        else
        {
            Component._componentMap[info.name] = constructor;
        }
    };
}

export function getComponentType<T extends ComponentNames>(type: T): Constructor<ComponentMap[T]>
{
    return Component._componentMap[type] as any;
}

/**
 * 组件名称与类定义映射，由 @RegisterComponent 装饰器进行填充。
 */
export const componentMap: ComponentMap = <any>{};

/**
 * 组件名称与类定义映射，新建组件一般都需扩展该接口。
 */
export interface ComponentMap extends MixinsComponentMap { Component: Component }

export type ComponentNames = keyof ComponentMap;
export type Components = ComponentMap[ComponentNames];

export interface Component extends MixinsComponent { }

/**
 * 组件
 *
 * 所有附加到Object3Ds的基类。
 *
 * 注意，您的代码永远不会直接创建组件。相反，你可以编写脚本代码，并将脚本附加到Object3D(游戏物体)上。
 */
export class Component extends Feng3dObject<Object3DEventMap> implements IDisposable
{
    // ------------------------------------------
    // Variables
    // ------------------------------------------
    /**
     * 此组件附加到的游戏对象。组件总是附加到游戏对象上。
     */
    get object3D()
    {
        return this._object3D;
    }

    /**
     * 标签
     */
    get tag()
    {
        return this._object3D.tag;
    }

    /**
     * The Transform attached to this Object3D (null if there is none attached).
     */
    get transform()
    {
        return this._object3D && this._object3D;
    }

    /**
     * 是否唯一，同类型3D对象组件只允许一个
     */
    get single()
    {
        return false;
    }

    // ------------------------------------------
    // Functions
    // ------------------------------------------
    /**
     * 创建一个组件
     */
    constructor()
    {
        super();
        this.onAny(this._onAnyListener, this);
    }

    /**
     * 初始化组件
     *
     * 在添加到Object3D时立即被调用。
     */
    init()
    {
    }

    /**
     * Adds a component class of type componentType to the game object.
     *
     * @param type A component class of type.
     * @returns The component that is added.
     */
    /**
     * Adds a component class of type componentType to the game object.
     *
     * @param type 组件类定义。
     * @returns 被添加的组件。
     */
    addComponent<T extends Component>(type: Constructor<T>): T
    {
        const c = new type();
        reactive(this._object3D).components.push(c);
        c.setObject3D(this._object3D);
        c.init();

        return c;
    }

    getComponent<T extends Component>(type: Constructor<T>): T
    {
        return this._object3D.components.find(c => c instanceof type) as T;
    }

    getComponentInChildren<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        const component = this.getComponent(type);
        if (component) return component;

        const children = this._object3D.children as Object3D[];
        for (const child of children)
        {
            if (!includeInactive && !child.activeSelf) continue;
            const found = child.components.find(c => c instanceof type) as T;
            if (found) return found;
            for (const grandchild of child.children as Object3D[])
            {
                const sub = grandchild.components.find(c => c instanceof type) as T;
                if (sub) return sub;
            }
        }

        return null;
    }

    getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        if (includeInactive || this._object3D.activeSelf)
        {
            const component = this.getComponent(type);
            if (component) return component;
        }
        const parent = this._object3D.parent as Object3D;
        if (parent)
        {
            const component = parent.components.find(c => c instanceof type) as T;
            if (component) return component;
            // 继续向上
            let p = parent.parent as Object3D;
            while (p)
            {
                const c = p.components.find(c => c instanceof type) as T;
                if (c) return c;
                p = p.parent as Object3D;
            }
        }

        return null;
    }

    getComponents<T extends Component>(type: Constructor<T>, results: T[] = []): T[]
    {
        for (const c of this._object3D.components)
        {
            if (!type || c instanceof type) results.push(c as T);
        }

        return results;
    }

    getComponentsInChildren<T extends Component>(type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        this.getComponents(type, results);

        const children = this._object3D.children as Object3D[];
        for (const child of children)
        {
            if (!includeInactive && !child.activeSelf) continue;
            for (const c of child.components)
            {
                if (!type || c instanceof type) results.push(c as T);
            }
            // 递归孙级
            for (const grandchild of child.children as Object3D[])
            {
                for (const c of grandchild.components)
                {
                    if (!type || c instanceof type) results.push(c as T);
                }
            }
        }

        return results;
    }

    getComponentsInParent<T extends Component>(type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        if (includeInactive || this._object3D.activeSelf)
        {
            this.getComponents(type, results);
        }
        let parent = this._object3D.parent as Object3D;
        while (parent)
        {
            if (includeInactive || parent.activeSelf)
            {
                for (const c of parent.components)
                {
                    if (!type || c instanceof type) results.push(c as T);
                }
            }
            parent = parent.parent as Object3D;
        }

        return results;
    }

    /**
     * 把事件分享到实体上。
     */
    getShareTargets()
    {
        return [this._object3D];
    }

    /**
     * 销毁
     */
    dispose()
    {
        this._object3D = <any>null;
        this._disposed = true;
    }

    beforeRender(_renderObject: RenderObject, _scene: Scene, _camera: Camera)
    {

    }

    /**
     * 监听对象的所有事件并且传播到所有组件中
     */
    private _onAnyListener(e: IEvent<any>)
    {
        // TODO: events removed from pure data Object3D
        // if (this._object3D)
        // { this._object3D.emitEvent(e); }
    }

    /**
     * 该方法仅在Object3D中使用
     * @private
     *
     * @param object3D 游戏对象
     */
    setObject3D(object3D: Object3D)
    {
        this._object3D = object3D;
    }
    protected _object3D: Object3D;

    /**
     * 组件名称与类定义映射，由 @RegisterComponent 装饰器进行填充。
     * @private
     */
    static _componentMap: { [name: string]: Constructor<Component> } = {};

    /**
     * 获取组件依赖列表
     *
     * @param type 组件类定义
     */
    static getDependencies(type: Constructor<Component>)
    {
        let prototype = type.prototype;
        let dependencies: Constructor<Component>[] = [];
        while (prototype)
        {
            dependencies = dependencies.concat((prototype[__component__] as ComponentInfo)?.dependencies || []);
            prototype = prototype.__proto__;
        }

        return dependencies;
    }

    /**
     * 判断组件是否为唯一组件。
     *
     * @param type 组件类定义
     */
    static isSingleComponent<T extends Component>(type: Constructor<T>)
    {
        let prototype = type.prototype;
        let isSingle = false;
        while (prototype && !isSingle)
        {
            isSingle = !!((prototype[__component__] as ComponentInfo)?.single);
            prototype = prototype.__proto__;
        }

        return isSingle;
    }
}
