namespace feng3d
{
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
     * 使用 @RegisterComponent 在组件类定义上注册组件，配合扩展 ComponentMap 接口后可使用 Entity.getComponent 等方法。
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
    export interface ComponentMap { Component: Component }

    export type ComponentNames = keyof ComponentMap;
    export type Components = ComponentMap[ComponentNames];

    export interface Component
    {
        once<K extends keyof GameObjectEventMap>(type: K, listener: (event: IEvent<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        emit<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean): IEvent<GameObjectEventMap[K]>;
        has<K extends keyof GameObjectEventMap>(type: K): boolean;
        on<K extends keyof GameObjectEventMap>(type: K, listener: (event: IEvent<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: IEvent<GameObjectEventMap[K]>) => any, thisObject?: any): void;
    }

    /**
     * 组件
     * 
     * 所有附加到GameObjects的基类。
     * 
     * 注意，您的代码永远不会直接创建组件。相反，你可以编写脚本代码，并将脚本附加到GameObject(游戏物体)上。
     */
    export class Component extends Feng3dObject implements IDisposable
    {
        //------------------------------------------
        // Variables
        //------------------------------------------
        /**
         * 此组件附加到的游戏对象。组件总是附加到游戏对象上。
         */
        get gameObject()
        {
            return this._gameObject;
        }

        /**
         * 标签
         */
        get tag()
        {
            return this._gameObject.tag;
        }

        /**
         * The Transform attached to this GameObject (null if there is none attached).
         */
        get transform()
        {
            return this._gameObject && this._gameObject.transform;
        }

        /**
         * 是否唯一，同类型3D对象组件只允许一个
         */
        get single()
        {
            return false;
        }

        //------------------------------------------
        // Functions
        //------------------------------------------
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
         * 在添加到GameObject时立即被调用。
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
            return this._gameObject.addComponent(type);
        }

        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         *
         * Using gameObject.GetComponent will return the first component that is found. If you expect there to be more than one component of the
         * same type, use gameObject.GetComponents instead, and cycle through the returned components testing for some unique property.
         *
         * @param type The type of Component to retrieve.
         * @returns The component to retrieve.
         */
        /**
         * 返回游戏对象附加的一个指定类型的组件，如果没有，则返回 null。
         *
         * 使用 gameObject.GetComponent 将返回找到的第一个组件。如果您希望有多个相同类型的组件，请改用 gameObject.GetComponents，并循环通过返回的组件测试某些唯一属性。
         *
         * @param type 要检索的组件类型。
         * @returns 要检索的组件。
         */
        getComponent<T extends Component>(type: Constructor<T>): T
        {
            return this._gameObject.getComponent(type);
        }

        /**
         * Returns the component of Type type in the GameObject or any of its children using depth first search.
         *
         * @param type The type of Component to retrieve.
         * @param includeInactive Should Components on inactive GameObjects be included in the found set?
         * @returns A component of the matching type, if found.
         */
        /**
         * 使用深度优先搜索返回 GameObject 或其任何子项中的 Type 组件。
         *
         * @param type 要检索的组件类型。
         * @param includeInactive 是否包含不活跃组件。
         * @returns 匹配类型的组件（如果找到）。
         */
        getComponentInChildren<T extends Component>(type: Constructor<T>, includeInactive = false): T
        {
            return this._gameObject.getComponentInChildren(type, includeInactive);
        }

        /**
         * Retrieves the component of Type type in the GameObject or any of its parents.
         *
         * This method recurses upwards until it finds a GameObject with a matching component. Only components on active GameObjects are matched.
         *
         * @param type Type of component to find.
         * @param includeInactive Should Components on inactive GameObjects be included in the found set?
         * @returns Returns a component if a component matching the type is found. Returns null otherwise.
         */
        /**
         * 检索GameObject或其任何父项type中的 Type 组件。
         *
         * 此方法向上递归，直到找到具有匹配组件的 GameObject。仅匹配活动游戏对象上的组件。
         *
         * @param type 要查找的组件类型。
         * @param includeInactive 是否包含不活跃组件。
         * @returns 如果找到与类型匹配的组件，则返回一个组件。否则返回 null。
         */
        getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive = false): T
        {
            return this._gameObject.getComponentInParent(type, includeInactive);
        }

        /**
         * Returns all components of Type `type` in the GameObject.
         *
         * @param type The type of component to retrieve.
         * @param results List to receive the results.
         * @returns all components of Type type in the GameObject.
         */
        /**
         * 返回GameObject中指定类型的所有组件。
         *
         * @param type 要检索的组件类型。
         * @param results 列出接收找到的组件。
         * @returns GameObject中指定类型的所有组件。
         */
        getComponents<T extends Component>(type: Constructor<T>, results: T[] = []): T[]
        {
            return this._gameObject.getComponents(type, results);
        }

        /**
         * Returns all components of Type type in the GameObject or any of its children children using depth first search. Works recursively.
         *
         * Unity searches for components recursively on child GameObjects. This means that it also includes all the child GameObjects of the target GameObject, and all subsequent child GameObjects.
         *
         * @param type The type of Component to retrieve.
         * @param includeInactive Should Components on inactive GameObjects be included in the found set?
         * @param results List to receive found Components.
         * @returns All found Components.
         */
        /**
         * 使用深度优先搜索返回 GameObject 或其任何子子项中 Type 的所有组件。递归工作。
         *
         * Unity 在子游戏对象上递归搜索组件。这意味着它还包括目标 GameObject 的所有子 GameObject，以及所有后续子 GameObject。
         *
         * @param type 要检索的组件类型。
         * @param includeInactive 非活动游戏对象上的组件是否应该包含在搜索结果中？
         * @param results 列出接收找到的组件。
         * @returns 所有找到的组件。
         */
        getComponentsInChildren<T extends Component>(type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
        {
            return this._gameObject.getComponentsInChildren(type, includeInactive, results);
        }

        /**
         * Returns all components of Type type in the GameObject or any of its parents.
         *
         * @param type The type of Component to retrieve.
         * @param includeInactive Should inactive Components be included in the found set?
         * @param results List holding the found Components.
         * @returns All components of Type type in the GameObject or any of its parents.
         */
        /**
         * 返回GameObject或其任何父级中指定的所有组件。
         *
         * @param type 要检索的组件类型。
         * @param includeInactive 非活动组件是否应该包含在搜索结果中？
         * @param results 列出找到的组件。
         * @returns GameObject或其任何父级中指定的所有组件。
         */
        getComponentsInParent<T extends Component>(type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
        {
            return this._gameObject.getComponentsInParent(type, includeInactive, results);
        }

        /**
         * 销毁
         */
        dispose()
        {
            this._gameObject = <any>null;
            this._disposed = true;
        }

        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {

        }

        /**
         * 监听对象的所有事件并且传播到所有组件中
         */
        private _onAnyListener(e: IEvent<any>)
        {
            if (this._gameObject)
                this._gameObject.emitEvent(e);
        }

        /**
         * 该方法仅在GameObject中使用
         * @private
         * 
         * @param gameObject 游戏对象
         */
        setGameObject(gameObject: GameObject)
        {
            this._gameObject = gameObject;
        }
        protected _gameObject: GameObject;

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
}
