namespace feng3d
{
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
            return this.internalGetGameObject();
        }

        /**
         * The tag of this game object.
         */
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
            if (this._transform == null)
            {
                this._transform = this.internalGetTransform();
            }
            return this._transform;
        }
        /**
         * 是否唯一，同类型3D对象组件只允许一个
         */
        get single()
        {
            return this._single;
        }

        //------------------------------------------
        // Functions
        //------------------------------------------
		/**
		 * 创建一个组件容器
		 */
        constructor(gameObject: GameObject)
        {
            super();
            this._gameObject = gameObject;
        }

        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				The type of Component to retrieve.
         * @return                  返回指定类型组件
         */
        getComponent<T extends Component>(type: ComponentConstructor<T>): T
        {
            return this.gameObject.getComponent(type);
        }

        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends Component>(type: ComponentConstructor<T> = null): T[]
        {
            return this.gameObject.getComponents(type);
        }

        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends Component>(type: ComponentConstructor<T> = null): T[]
        {
            return this.gameObject.getComponentsInChildren(type);
        }

        //------------------------------------------
        // Static Functions
        //------------------------------------------

        //------------------------------------------
        // Protected Properties
        //------------------------------------------
		/**
		 * 组件列表
		 */
        protected _single = false;

        //------------------------------------------
        // Protected Functions
        //------------------------------------------

        //------------------------------------------
        // Private Properties
        //------------------------------------------
        private _gameObject: GameObject;
        private _tag: string;
        private _transform: Transform;

        //------------------------------------------
        // Private Methods
        //------------------------------------------
        private internalGetTransform()
        {
            if (this._gameObject)
                return this._gameObject.transform;
            return null;
        }

        private internalGetGameObject()
        {
            return this._gameObject;
        }

        /**
         * 销毁
         */
        dispose()
        {

        }
    }
}
