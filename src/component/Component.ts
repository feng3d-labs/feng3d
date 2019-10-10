namespace feng3d
{
    export interface ComponentMap { Component: Component }
    export type Components = ComponentMap[keyof ComponentMap];

    export interface Component
    {
        once<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean): Event<GameObjectEventMap[K]>;
        has<K extends keyof GameObjectEventMap>(type: K): boolean;
        on<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any);
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

        /**
         * 是否已销毁
         */
        get disposed() { return this._disposed; }
        private _disposed = false;

        //------------------------------------------
        // Functions
        //------------------------------------------
		/**
		 * 创建一个组件容器
		 */
        constructor()
        {
            super();
            this.onAll(this._onAllListener, this);
        }

        init()
        {
        }

        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				The type of Component to retrieve.
         * @return                  返回指定类型组件
         */
        getComponent<T extends Components>(type: Constructor<T>): T
        {
            return this.gameObject.getComponent(type);
        }

        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends Components>(type?: Constructor<T>): T[]
        {
            return this.gameObject.getComponents(type);
        }

        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends Components>(type?: Constructor<T>, filter?: (compnent: T) => { findchildren: boolean, value: boolean }, result?: T[]): T[]
        {
            return this.gameObject.getComponentsInChildren(type, filter, result);
        }

        /**
         * 从父类中获取组件
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInParents<T extends Components>(type?: Constructor<T>, result?: T[]): T[]
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

        beforeRender(gl: GL, renderAtomic: RenderAtomic, scene3d: Scene3D, camera: Camera)
        {

        }

        /**
         * 监听对象的所有事件并且传播到所有组件中
         */
        private _onAllListener(e: Event<any>)
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
