namespace feng3d
{
    export interface ComponentMap
    {
        camera: new () => Camera;
    }

    /**
     * Base class for all entities in feng3d scenes.
     */
    export class GameObject extends Feng3dObject
    {
        //------------------------------------------
        // Variables
        //------------------------------------------
        /**
         * The Transform attached to this GameObject. (null if there is none attached).
         */
        public get transform()
        {
            return this._transform;
        }
        private _transform: Transform;

        /**
         * @private
         */
        public readonly renderData = new Object3DRenderAtomic();

		/**
		 * 子组件个数
		 */
        public get numComponents(): number
        {
            return this.components.length;
        }

        public updateRender(renderContext: RenderContext)
        {
            if (this.renderData.renderHolderInvalid)
            {
                this.renderData.clear();
                this.collectRenderDataHolder(this.renderData);
                this.renderData.renderHolderInvalid = false;
            }
            this.renderData.update(renderContext);
        }

        //------------------------------------------
        // Public Functions
        //------------------------------------------
        /**
         * 构建3D对象
         */
        constructor(name = "GameObject")
        {
            super();
            this.name = name;
            this._transform = this.addComponent(Transform);
            //
            GameObject._gameObjects.push(this);
        }

        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        public getComponentAt(index: number): Component
        {
            debuger && assert(index < this.numComponents, "给出索引超出范围");
            return this.components[index];
        }

		/**
		 * 添加组件
         * Adds a component class named className to the game object.
		 * @param param 被添加组件
		 */
        public addComponent<T extends Component>(param: (new () => T)): T
        {
            var component: T;
            if (this.getComponent(param))
            {
                alert(`The compnent ${component.constructor["name"]} can't be added because ${this.name} already contains the same component.`);
                return;
            }
            component = new param();
            this.addComponentAt(component, this.components.length);
            return component;
        }

        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        private hasComponent(com: Component): boolean
        {
            return this.components.indexOf(com) != -1;
        }

        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        public getComponent<T extends Component>(type: new () => T): T
        {
            var component = this.getComponents(type)[0];
            return component;
        }

        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        public getComponents<T extends Component>(type: new () => T = null): T[]
        {
            var filterResult: Component[];
            if (!type)
            {
                filterResult = this.components.concat();
            } else
            {
                filterResult = this.components.filter(function (value: Component, index: number, array: Component[]): boolean
                {
                    return value instanceof type;
                });
            }
            return <T[]>filterResult;
        }

        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        public setComponentIndex(component: Component, index: number): void
        {
            debuger && assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

            var oldIndex: number = this.components.indexOf(component);
            debuger && assert(oldIndex >= 0 && oldIndex < this.numComponents, "子组件不在容器内");

            this.components.splice(oldIndex, 1);
            this.components.splice(index, 0, component);
        }

		/**
		 * 设置组件到指定位置
		 * @param component		被设置的组件
		 * @param index			索引
		 */
        public setComponentAt(component: Component, index: number)
        {
            if (this.components[index])
            {
                this.removeComponentAt(index);
            }
            this.addComponentAt(component, index);
        }

		/**
		 * 移除组件
		 * @param component 被移除组件
		 */
        public removeComponent(component: Component): void
        {
            debuger && assert(this.hasComponent(component), "只能移除在容器中的组件");

            var index: number = this.getComponentIndex(component);
            this.removeComponentAt(index);
        }

        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        public getComponentIndex(component: Component): number
        {
            debuger && assert(this.components.indexOf(component) != -1, "组件不在容器中");

            var index: number = this.components.indexOf(component);
            return index;
        }

        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        public removeComponentAt(index: number): Component
        {
            debuger && assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

            var component: Component = this.components.splice(index, 1)[0];
            //派发移除组件事件
            component.dispatchEvent(new ComponentEvent(ComponentEvent.REMOVED_COMPONENT, { container: this, child: component }));
            this.dispatchEvent(new ComponentEvent(ComponentEvent.REMOVED_COMPONENT, { container: this, child: component }));
            this.removeRenderDataHolder(component);
            return component;
        }

        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        public swapComponentsAt(index1: number, index2: number): void
        {
            debuger && assert(index1 >= 0 && index1 < this.numComponents, "第一个子组件的索引位置超出范围");
            debuger && assert(index2 >= 0 && index2 < this.numComponents, "第二个子组件的索引位置超出范围");

            var temp: Component = this.components[index1];
            this.components[index1] = this.components[index2];
            this.components[index2] = temp;
        }

        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        public swapComponents(a: Component, b: Component): void
        {
            debuger && assert(this.hasComponent(a), "第一个子组件不在容器中");
            debuger && assert(this.hasComponent(b), "第二个子组件不在容器中");

            this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
        }

        /**
         * 移除指定类型组件
         * @param type 组件类型
         */
        public removeComponentsByType<T extends Component>(type: new () => T): T[]
        {
            var removeComponents = [];
            for (var i = this.components.length - 1; i >= 0; i--)
            {
                if (this.components[i].constructor == type)
                    removeComponents.push(this.removeComponentAt(i));
            }
            return removeComponents;
        }
        //------------------------------------------
        // Static Functions
        //------------------------------------------
        private static _gameObjects: GameObject[] = [];
        /**
         * Finds a game object by name and returns it.
         * @param name 
         */
        public static find(name: string)
        {
            for (var i = 0; i < this._gameObjects.length; i++)
            {
                var element = this._gameObjects[i];
                if (element.name == name)
                    return element;
            }
        }

        //------------------------------------------
        // Protected Properties
        //------------------------------------------
        /**
		 * 组件列表
		 */
        protected components: Component[] = [];

        //------------------------------------------
        // Protected Functions
        //------------------------------------------

        //------------------------------------------
        // Private Properties
        //------------------------------------------

        //------------------------------------------
        // Private Methods
        //------------------------------------------
		/**
		 * 添加组件到指定位置
		 * @param component		被添加的组件
		 * @param index			插入的位置
		 */
        private addComponentAt(component: Component, index: number): void
        {
            debuger && assert(index >= 0 && index <= this.numComponents, "给出索引超出范围");

            if (this.hasComponent(component))
            {
                index = Math.min(index, this.components.length - 1);
                this.setComponentIndex(component, index)
                return;
            }
            //组件唯一时移除同类型的组件
            if (component.single)
                this.removeComponentsByType(<new () => Component>component.constructor);

            this.components.splice(index, 0, component);
            //派发添加组件事件
            component.dispatchEvent(new ComponentEvent(ComponentEvent.ADDED_COMPONENT, { container: this, child: component }));
            this.dispatchEvent(new ComponentEvent(ComponentEvent.ADDED_COMPONENT, { container: this, child: component }));
            this.addRenderDataHolder(component);
        }
    }
}