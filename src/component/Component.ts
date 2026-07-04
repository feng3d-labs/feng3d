import { IEvent } from '@feng3d/event';
import { Constructor, IDisposable } from '@feng3d/polyfill';
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
        return this._object3D && this._object3D.transform;
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
        return _object3DLogic(this._object3D).addComponent(type);
    }

    /**
     * Returns the component of Type type if the game object has one attached, null if it doesn't.
     *
     * Using object3D.GetComponent will return the first component that is found. If you expect there to be more than one component of the
     * same type, use object3D.GetComponents instead, and cycle through the returned components testing for some unique property.
     *
     * @param type The type of Component to retrieve.
     * @returns The component to retrieve.
     */
    /**
     * 返回游戏对象附加的一个指定类型的组件，如果没有，则返回 null。
     *
     * 使用 object3D.GetComponent 将返回找到的第一个组件。如果您希望有多个相同类型的组件，请改用 object3D.GetComponents，并循环通过返回的组件测试某些唯一属性。
     *
     * @param type 要检索的组件类型。
     * @returns 要检索的组件。
     */
    getComponent<T extends Component>(type: Constructor<T>): T
    {
        return _object3DLogic(this._object3D).getComponent(type);
    }

    /**
     * Returns the component of Type type in the Object3D or any of its children using depth first search.
     *
     * @param type The type of Component to retrieve.
     * @param includeInactive Should Components on inactive Object3Ds be included in the found set?
     * @returns A component of the matching type, if found.
     */
    /**
     * 使用深度优先搜索返回 Object3D 或其任何子项中的 Type 组件。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 是否包含不活跃组件。
     * @returns 匹配类型的组件（如果找到）。
     */
    getComponentInChildren<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        return _object3DLogic(this._object3D).getComponentInChildren(type, includeInactive);
    }

    /**
     * Retrieves the component of Type type in the Object3D or any of its parents.
     *
     * This method recurses upwards until it finds a Object3D with a matching component. Only components on active Object3Ds are matched.
     *
     * @param type Type of component to find.
     * @param includeInactive Should Components on inactive Object3Ds be included in the found set?
     * @returns Returns a component if a component matching the type is found. Returns null otherwise.
     */
    /**
     * 检索Object3D或其任何父项type中的 Type 组件。
     *
     * 此方法向上递归，直到找到具有匹配组件的 Object3D。仅匹配活动游戏对象上的组件。
     *
     * @param type 要查找的组件类型。
     * @param includeInactive 是否包含不活跃组件。
     * @returns 如果找到与类型匹配的组件，则返回一个组件。否则返回 null。
     */
    getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        return _object3DLogic(this._object3D).getComponentInParent(type, includeInactive);
    }

    /**
     * Returns all components of Type `type` in the Object3D.
     *
     * @param type The type of component to retrieve.
     * @param results List to receive the results.
     * @returns all components of Type type in the Object3D.
     */
    /**
     * 返回Object3D中指定类型的所有组件。
     *
     * @param type 要检索的组件类型。
     * @param results 列出接收找到的组件。
     * @returns Object3D中指定类型的所有组件。
     */
    getComponents<T extends Component>(type: Constructor<T>, results: T[] = []): T[]
    {
        return _object3DLogic(this._object3D).getComponents(type, results);
    }

    /**
     * Returns all components of Type type in the Object3D or any of its children children using depth first search. Works recursively.
     *
     * Unity searches for components recursively on child Object3Ds. This means that it also includes all the child Object3Ds of the target Object3D, and all subsequent child Object3Ds.
     *
     * @param type The type of Component to retrieve.
     * @param includeInactive Should Components on inactive Object3Ds be included in the found set?
     * @param results List to receive found Components.
     * @returns All found Components.
     */
    /**
     * 使用深度优先搜索返回 Object3D 或其任何子子项中 Type 的所有组件。递归工作。
     *
     * Unity 在子游戏对象上递归搜索组件。这意味着它还包括目标 Object3D 的所有子 Object3D，以及所有后续子 Object3D。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 非活动游戏对象上的组件是否应该包含在搜索结果中？
     * @param results 列出接收找到的组件。
     * @returns 所有找到的组件。
     */
    getComponentsInChildren<T extends Component>(type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        return _object3DLogic(this._object3D).getComponentsInChildren(type, includeInactive, results);
    }

    /**
     * Returns all components of Type type in the Object3D or any of its parents.
     *
     * @param type The type of Component to retrieve.
     * @param includeInactive Should inactive Components be included in the found set?
     * @param results List holding the found Components.
     * @returns All components of Type type in the Object3D or any of its parents.
     */
    /**
     * 返回Object3D或其任何父级中指定的所有组件。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 非活动组件是否应该包含在搜索结果中？
     * @param results 列出找到的组件。
     * @returns Object3D或其任何父级中指定的所有组件。
     */
    getComponentsInParent<T extends Component>(type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        return _object3DLogic(this._object3D).getComponentsInParent(type, includeInactive, results);
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
