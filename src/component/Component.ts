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

    export interface ComponentEventMap extends GameObjectEventMap
    {
    }

    export interface Component
    {
        once<K extends keyof ComponentEventMap>(type: K, listener: (event: Event<ComponentEventMap[K]>) => void, thisObject?: any, priority?: number): this;
        emit<K extends keyof ComponentEventMap>(type: K, data?: ComponentEventMap[K], bubbles?: boolean): Event<ComponentEventMap[K]>;
        has<K extends keyof ComponentEventMap>(type: K): boolean;
        on<K extends keyof ComponentEventMap>(type: K, listener: (event: Event<ComponentEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): this;
        off<K extends keyof ComponentEventMap>(type?: K, listener?: (event: Event<ComponentEventMap[K]>) => any, thisObject?: any): this;
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
        @serialize
        get gameObject()
        {
            return this._gameObject;
        }

        set gameObject(v)
        {
            if (this._gameObject === v)
            {
                return;
            }
            console.assert(!this._gameObject, "组件无法再次加入其它GameObject中!");
            this._gameObject = v;
        }

        get name()
        {
            return this._gameObject?.name;
        }

        set name(v)
        {
            if (this._gameObject)
            {
                this._gameObject.name = v;
            }
        }

        /**
         * 标签
         */
        @serialize
        tag: string;

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
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): Component
        {
            return this.gameObject.getComponentAt(index);
        }

        /**
         * 添加指定组件类型到游戏对象
         * 
         * @type type 被添加组件
         */
        addComponent<T extends ComponentNames>(type: T, callback: (component: ComponentMap[T]) => void = null): ComponentMap[T]
        {
            return this.gameObject.addComponent(type, callback);
        }

        /**
         * 添加脚本
         * @param script   脚本路径
         */
        addScript(scriptName: string)
        {
            return this.gameObject.addScript(scriptName);
        }

        /**
         * 获取游戏对象上第一个指定类型的组件，不存在时返回null
         * 
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        getComponent<T extends ComponentNames>(type: T): ComponentMap[T]
        {
            return this.gameObject.getComponent(type);
        }

        /**
         * 获取游戏对象上所有指定类型的组件数组
         * 
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends ComponentNames>(type: T): ComponentMap[T][]
        {
            return this.gameObject.getComponents(type);
        }

        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        setComponentIndex(component: Components, index: number): void
        {
            this.gameObject.setComponentIndex(component, index);
        }

        /**
         * 设置组件到指定位置
         * @param component		被设置的组件
         * @param index			索引
         */
        setComponentAt(component: Components, index: number)
        {
            this.gameObject.setComponentAt(component, index);
        }

        /**
         * 移除组件
         * @param component 被移除组件
         */
        removeComponent(component: Components): void
        {
            this.gameObject.removeComponent(component);
        }

        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(component: Components): number
        {
            return this.gameObject.getComponentIndex(component);
        }

        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): Component
        {
            return this.gameObject.removeComponentAt(index);
        }

        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        swapComponentsAt(index1: number, index2: number): void
        {
            this.swapComponentsAt(index1, index2);
        }

        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        swapComponents(a: Components, b: Components): void
        {
            this.swapComponents(a, b);
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
