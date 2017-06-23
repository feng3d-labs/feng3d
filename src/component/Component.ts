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
        public get gameObject()
        {
            return this.internalGetGameObject();
        }

        /**
         * The tag of this game object.
         */
        public get tag()
        {
            return this._tag;
        }
        public set tag(value)
        {
            this._tag = value;
        }

        /**
         * The Transform attached to this GameObject (null if there is none attached).
         */
        public get transform()
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
        public get single()
        {
            return this._single;
        }

        //------------------------------------------
        // Public Functions
        //------------------------------------------
		/**
		 * 创建一个组件容器
		 */
        constructor()
        {
            super();
            this.initComponent();
        }

        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				The type of Component to retrieve.
         * @return                  返回指定类型组件
         */
        public getComponent<T extends Component>(type: new () => T): T
        {
            return this.gameObject.getComponent(type);
        }

        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        public getComponents<T extends Component>(type: new () => T = null): T[]
        {
            return this.gameObject.getComponents(type);
        }

        /**
         * 派发事件，该事件将会强制冒泡到3D对象中
		 * @param event						调度到事件流中的 Event 对象。
         */
        public dispatchEvent(event: Event): boolean
        {
            var result = super.dispatchEvent(event);
            if (result)
            {
                this.gameObject && this.gameObject.dispatchEvent(event);
            }
            return result;
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
        /**
         * 初始化组件
         */
        protected initComponent(): void
        {
            //以最高优先级监听组件被添加，设置父组件
            this.addEventListener(ComponentEvent.ADDED_COMPONENT, this._onAddedComponent, this, Number.MAX_VALUE);
            //以最低优先级监听组件被删除，清空父组件
            this.addEventListener(ComponentEvent.REMOVED_COMPONENT, this._onRemovedComponent, this, Number.MIN_VALUE);
        }

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void
        {

        }

        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void
        {

        }

        /**
         * 获取冒泡对象
         */
        protected getBubbleTargets(event: Event = null): IEventDispatcher[]
        {
            var bubbleTargets = super.getBubbleTargets(event);
            bubbleTargets.push(this.gameObject);
            return bubbleTargets;
        }

        //------------------------------------------
        // Private Properties
        //------------------------------------------
        private _gameObject: GameObject;
        private _tag: string;
        private _transform: Transform;

        //------------------------------------------
        // Private Methods
        //------------------------------------------
        /**
         * 处理添加组件事件，此处为被添加，设置父组件
         */
        private _onAddedComponent(event: ComponentEvent): void
        {
            var data: { container: GameObject, child: Component } = event.data;
            if (data.child == this)
            {
                this._gameObject = data.container;
                this.onBeAddedComponent(event);
            }
        }

        /**
         * 处理移除组件事件，此处为被移除，清空父组件
         */
        private _onRemovedComponent(event: ComponentEvent): void
        {
            var data: { container: GameObject, child: Component } = event.data;
            if (event.data.child == this)
            {
                this.onBeRemovedComponent(event);
                this._gameObject = null;
            }
        }

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
    }
}
