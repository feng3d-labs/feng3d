module feng3d
{

	/**
	 * 组件容器（集合）
	 * @author feng 2015-5-6
	 */
    export class Component extends EventDispatcher
    {
        /**
         * 父组件
         */
        protected _parentComponent: Component;

		/**
		 * 组件列表
		 */
        protected components_: Component[] = [];

        /**
         * 是否唯一，同类型3D对象组件只允许一个
         */
        public get single() { return this._single; }
        protected _single = false;

        /**
         * 组件类型
         */
        public get type() { return this._type; }
        protected _type: new () => Component;

		/**
		 * 创建一个组件容器
		 */
        constructor()
        {
            super();
            this.initComponent();
            this._type = <any>this.constructor;
        }

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
         * 父组件
         */
        public get parentComponent(): Component
        {
            return this._parentComponent;
        }

		/**
		 * 子组件个数
		 */
        public get numComponents(): number
        {
            return this.components_.length;
        }

        /**
         * 获取组件列表，无法通过返回数组对该组件进行子组件增删等操作
         */
        public get components()
        {
            return this.components_.concat();
        }

		/**
		 * 添加组件
		 * @param component 被添加组件
		 */
        public addComponent(component: Component): void
        {
            if (this.hasComponent(component))
            {
                this.setComponentIndex(component, this.components_.length - 1);
                return;
            }

            this.addComponentAt(component, this.components_.length);
        }

		/**
		 * 添加组件到指定位置
		 * @param component		被添加的组件
		 * @param index			插入的位置
		 */
        public addComponentAt(component: Component, index: number): void
        {
            debuger && assert(component != this, "子项与父项不能相同");
            debuger && assert(index >= 0 && index <= this.numComponents, "给出索引超出范围");

            if (this.hasComponent(component))
            {
                index = Math.min(index, this.components_.length - 1);
                this.setComponentIndex(component, index)
                return;
            }
            //组件唯一时移除同类型的组件
            if (component.single)
                this.removeComponentsByType(component.type);

            this.components_.splice(index, 0, component);
            //派发添加组件事件
            component.dispatchEvent(new ComponentEvent(ComponentEvent.ADDED_COMPONENT, { container: this, child: component }));
            this.dispatchEvent(new ComponentEvent(ComponentEvent.ADDED_COMPONENT, { container: this, child: component }));
        }

		/**
		 * 设置组件到指定位置
		 * @param component		被设置的组件
		 * @param index			索引
		 */
        public setComponentAt(component: Component, index: number)
        {
            if (this.components_[index])
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
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        public removeComponentAt(index: number): Component
        {
            debuger && assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

            var component: Component = this.components_.splice(index, 1)[0];
            //派发移除组件事件
            component.dispatchEvent(new ComponentEvent(ComponentEvent.REMOVED_COMPONENT, { container: this, child: component }));
            this.dispatchEvent(new ComponentEvent(ComponentEvent.REMOVED_COMPONENT, { container: this, child: component }));
            return component;
        }

        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        public getComponentIndex(component: Component): number
        {
            debuger && assert(this.components_.indexOf(component) != -1, "组件不在容器中");

            var index: number = this.components_.indexOf(component);
            return index;
        }

        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        public setComponentIndex(component: Component, index: number): void
        {
            debuger && assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

            var oldIndex: number = this.components_.indexOf(component);
            debuger && assert(oldIndex >= 0 && oldIndex < this.numComponents, "子组件不在容器内");

            this.components_.splice(oldIndex, 1);
            this.components_.splice(index, 0, component);
        }

        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        public getComponentAt(index: number): Component
        {
            debuger && assert(index < this.numComponents, "给出索引超出范围");
            return this.components_[index];
        }

        /**
         * 根据类定义获取组件
         * <p>如果存在多个则返回第一个</p>
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        public getComponentByType<T extends Component>(type: new () => T): T
        {
            var component = this.getComponentsByType(type)[0];
            return component;
        }

        /**
         * 根据类定义查找组件
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        public getComponentsByType<T extends Component>(type: new () => T): T[]
        {
            var filterResult: any = this.components_.filter(function (value: Component, index: number, array: Component[]): boolean
            {
                return value instanceof type;
            });

            return filterResult;
        }

        /**
         * 移除指定类型组件
         * @param type 组件类型
         */
        public removeComponentsByType<T extends Component>(type: new () => T): T[]
        {
            var removeComponents = [];
            for (var i = this.components_.length - 1; i >= 0; i--)
            {
                if (this.components_[i]._type == type)
                    removeComponents.push(this.removeComponentAt(i));
            }
            return removeComponents;
        }

        /**
         * 根据类定义获取或创建组件
         * <p>当不存在该类型对象时创建一个该组件并且添加到容器中</p>
         * @param cls       类定义
         * @return          返回与给出类定义一致的组件
         */
        public getOrCreateComponentByClass<T extends Component>(cls: new () => T): T
        {
            var component = this.getComponentByType(cls);
            if (component == null)
            {
                component = new cls();
                this.addComponent(component);
            }
            return component;
        }

        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        public hasComponent(com: Component): boolean
        {
            return this.components_.indexOf(com) != -1;
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

            var temp: Component = this.components_[index1];
            this.components_[index1] = this.components_[index2];
            this.components_[index2] = temp;
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
         * 派发子组件事件
         * <p>事件广播给子组件</p>
         * @param event     事件
         * @param depth     广播深度
         */
        public dispatchChildrenEvent(event: Event, depth = 1): void
        {
            if (depth == 0)
                return;
            this.components_.forEach(function (value: Component, index: number, array: Component[]): void
            {
                value.dispatchEvent(event);
                value.dispatchChildrenEvent(event, depth - 1)
            });
        }

        //------------------------------------------
        //@protected
        //------------------------------------------

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
            bubbleTargets.push(this._parentComponent);
            return bubbleTargets;
        }

        //------------------------------------------
        //@private
        //------------------------------------------

        /**
         * 处理添加组件事件，此处为被添加，设置父组件
         */
        private _onAddedComponent(event: ComponentEvent): void
        {
            var data: { container: Component, child: Component } = event.data;
            if (data.child == this)
            {
                this._parentComponent = data.container;
                this.onBeAddedComponent(event);
            }
        }

        /**
         * 处理移除组件事件，此处为被移除，清空父组件
         */
        private _onRemovedComponent(event: ComponentEvent): void
        {
            var data: { container: Component, child: Component } = event.data;
            if (event.data.child == this)
            {
                this.onBeRemovedComponent(event);
                this._parentComponent = null;
            }
        }
    }
}
