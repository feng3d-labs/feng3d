namespace feng3d
{
    /**
     * 组件名称与类定义映射，由 @RegisterComponent 装饰器进行填充。
     */
    export const componentMap: ComponentMap = <any>{};

    /**
     * 注册组件
     * 
     * 使用 @RegisterComponent 在组件类定义上注册组件，配合扩展 ComponentMap 接口后可使用 GameObject.getComponent 等方法。
     * 
     * @param component 组件名称，默认使用类名称
     */
    export function RegisterComponent(component?: string)
    {
        return (constructor: Function) =>
        {
            component = component || constructor["name"];
            componentMap[<string>component] = constructor;
        }
    }

    /**
     * 组件名称与类定义映射，新建组件一般都需扩展该接口。
     */
    export interface ComponentMap { Component: Component }

    export type ComponentNames = keyof ComponentMap;
    export type Components = ComponentMap[ComponentNames];

    export interface Component
    {
        once<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean): Event<GameObjectEventMap[K]>;
        has<K extends keyof GameObjectEventMap>(type: K): boolean;
        on<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any): void;
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
        @serialize
        tag: string;

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
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				The type of Component to retrieve.
         * @return                  返回指定类型组件
         */
        getComponent<T extends ComponentNames>(type: T): ComponentMap[T]
        {
            return this.gameObject.getComponent(type);
        }

        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends ComponentNames>(type?: T): ComponentMap[T][]
        {
            return this.gameObject.getComponents(type);
        }

        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends ComponentNames>(type?: T, filter?: (compnent: ComponentMap[T]) => { findchildren: boolean, value: boolean }, result?: ComponentMap[T][]): ComponentMap[T][]
        {
            return this.gameObject.getComponentsInChildren(type, filter, result);
        }

        /**
         * 从父类中获取组件
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInParents<T extends ComponentNames>(type?: T, result?: ComponentMap[T][]): ComponentMap[T][]
        {
            return this.gameObject.getComponentsInParents(type, result);
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
        private _onAnyListener(e: Event<any>)
        {
            if (this._gameObject)
                this._gameObject.dispatchEvent(e);
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

        //------------------------------------------
        // Static Functions
        //------------------------------------------

        //------------------------------------------
        // Protected Properties
        //------------------------------------------
        protected _gameObject: GameObject;

        //------------------------------------------
        // Protected Functions
        //------------------------------------------

        //------------------------------------------
        // Private Properties
        //------------------------------------------
    }
}
