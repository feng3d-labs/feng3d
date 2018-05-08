namespace feng3d
{

    export type ValueOf<T> = T[keyof T];
    export interface ComponentRawMap
    {
    }
    export type ComponentRaw = ValueOf<ComponentRawMap>;

	/**
     * Base class for everything attached to GameObjects.
     * 
     * Note that your code will never directly create a Component. Instead, you write script code, and attach the script to a GameObject. See Also: ScriptableObject as a way to create scripts that do not attach to any GameObject.
	 */
    export class Component extends Feng3dObject
    {
        //------------------------------------------
        // Variables
        //------------------------------------------
        /**
         * The game object this component is attached to. A component is always attached to a game object.
         */
        get gameObject()
        {
            return this._gameObject;
        }

        /**
         * The tag of this game object.
         */
        @serialize
        get tag()
        {
            return this._tag;
        }
        set tag(value)
        {
            this._tag = value;
        }

        /**
         * The Transform attached to this GameObject (null if there is none attached).
         */
        get transform()
        {
            return this._gameObject.transform;
        }

        /**
         * 是否唯一，同类型3D对象组件只允许一个
         */
        get single()
        {
            return false;
        }

        /**
         * 是否序列化
         */
        serializable = true;

        /**
         * 是否显示在检查器中
         */
        showInInspector = true;

        //------------------------------------------
        // Functions
        //------------------------------------------
		/**
		 * 创建一个组件容器
		 */
        constructor()
        {
            super();
        }

        set(setfun: (space: this) => void)
        {
            setfun(this);
            return this;
        }

        init(gameObject: GameObject)
        {
            this._gameObject = gameObject;
        }

        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				The type of Component to retrieve.
         * @return                  返回指定类型组件
         */
        getComponent<T extends Component>(type: ComponentConstructor<T>)
        {
            return this.gameObject.getComponent(type);
        }

        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends Component>(type?: ComponentConstructor<T>)
        {
            return this.gameObject.getComponents(type);
        }

        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends Component>(type?: ComponentConstructor<T>, filter?: (compnent: T) => { findchildren: boolean, value: boolean }, result?: T[])
        {
            return this.gameObject.getComponentsInChildren(type, filter, result);
        }

        //------------------------------------------
        // Static Functions
        //------------------------------------------

        //------------------------------------------
        // Protected Properties
        //------------------------------------------

        //------------------------------------------
        // Protected Functions
        //------------------------------------------

        //------------------------------------------
        // Private Properties
        //------------------------------------------
        private _gameObject: GameObject;
        private _tag: string;

        /**
         * 销毁
         */
        dispose()
        {
            this._gameObject = <any>null;
        }

        preRender(renderAtomic: RenderAtomic)
        {

        }
    }
}
