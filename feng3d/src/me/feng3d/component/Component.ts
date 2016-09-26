module me.feng3d {

	/**
	 * 组件容器（集合）
	 * @author feng 2015-5-6
	 */
    export class Component extends EventDispatcher implements IComponent {

        /**
         * 父组件
         */
        protected _parentComponent: IComponent;

		/**
		 * 组件列表
		 */
        protected components: IComponent[] = [];

		/**
		 * 创建一个组件容器
		 */
        constructor() {

            super();
            this.initComponent();
        }

        /**
         * 初始化组件
         */
        protected initComponent(): void {

            //以最高优先级监听组件被添加，设置父组件
            this.addEventListener(ComponentEvent.ADDED_COMPONENT, this._onAddedComponent, this, Number.MAX_VALUE);
            //以最低优先级监听组件被删除，清空父组件
            this.addEventListener(ComponentEvent.REMOVED_COMPONENT, this._onRemovedComponent, this, Number.MIN_VALUE);
        }

        /**
         * 父组件
         */
        public get parentComponent(): IComponent {

            return this._parentComponent;
        }

		/**
		 * 子组件个数
		 */
        public get numComponents(): number {

            return this.components.length;
        }

		/**
		 * 添加组件
		 * @param component 被添加组件
		 */
        public addComponent(component: IComponent): void {

            if (this.hasComponent(component)) {
                this.setComponentIndex(component, this.components.length - 1);
                return;
            }

            this.addComponentAt(component, this.components.length);
        }

		/**
		 * 添加组件到指定位置
		 * @param component		被添加的组件
		 * @param index			插入的位置
		 */
        public addComponentAt(component: IComponent, index: number): void {

            assert(component != this, "子项与父项不能相同");
            assert(index >= 0 && index <= this.numComponents, "给出索引超出范围");

            if (this.hasComponent(component)) {
                index = Math.min(index, this.components.length - 1);
                this.setComponentIndex(component, index)
                return;
            }

            this.components.splice(index, 0, component);
            //派发添加组件事件
            component.dispatchEvent(new ComponentEvent(ComponentEvent.ADDED_COMPONENT, { container: this, child: component }, true));
        }

		/**
		 * 移除组件
		 * @param component 被移除组件
		 */
        public removeComponent(component: IComponent): void {

            assert(this.hasComponent(component), "只能移除在容器中的组件");

            var index: number = this.getComponentIndex(component);
            this.removeComponentAt(index);
        }

        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        public removeComponentAt(index: number): IComponent {

            assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

            var component: IComponent = this.components.splice(index, 1)[0];
            //派发移除组件事件
            component.dispatchEvent(new ComponentEvent(ComponentEvent.REMOVED_COMPONENT, { container: this, child: component }, true));
            return component;
        }

        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        public getComponentIndex(component: IComponent): number {

            assert(this.components.indexOf(component) != -1, "组件不在容器中");

            var index: number = this.components.indexOf(component);
            return index;
        }

        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        public setComponentIndex(component: IComponent, index: number): void {

            assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

            var oldIndex: number = this.components.indexOf(component);
            assert(oldIndex >= 0 && oldIndex < this.numComponents, "子组件不在容器内");

            this.components.splice(oldIndex, 1);
            this.components.splice(index, 0, component);
        }

        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        public getComponentAt(index: number): IComponent {

            assert(index < this.numComponents, "给出索引超出范围");
            return this.components[index];
        }

        /**
         * 根据组件名称获取组件
         * <p>注意：此处比较的是componentName而非name</p>
         * @param componentName		组件名称
         * @return 					获取到的组件
         */
        public getComponentByName(name: String): IComponent {

            var filterResult = this.getComponentsByName(name);
            return filterResult[0];
        }

        /**
         * 获取与给出组件名称相同的所有组件
         * <p>注意：此处比较的是componentName而非name</p>
         * @param name		        组件名称
         * @return 					获取到的组件
         */
        public getComponentsByName(name: String): IComponent[] {

            var filterResult = this.components.filter(function (item: IComponent, ...args): boolean {
                return item.name == name;
            });
            return filterResult;
        }

        /**
         * 根据类定义获取组件
         * <p>如果存在多个则返回第一个</p>
         * @param cls				类定义
         * @return                  返回指定类型组件
         */
        public getComponentByClass<T extends IComponent>(cls: new (...args) => T): T {

            var component = this.getComponentsByClass(cls)[0];
            return component;
        }

        /**
         * 根据类定义查找组件
         * @param cls		类定义
         * @return			返回与给出类定义一致的组件
         */
        public getComponentsByClass<T extends IComponent>(cls: new (...args) => T): T[] {

            var filterResult: any = this.components.filter(function (item: T, ...args): boolean {
                return item instanceof cls;
            });

            return filterResult;
        }

        /**
         * 根据类定义获取或创建组件
         * <p>当不存在该类型对象时创建一个该组件并且添加到容器中</p>
         * @param cls       类定义
         * @return          返回与给出类定义一致的组件
         */
        public getOrCreateComponentByClass<T extends IComponent>(cls: new (...args) => T): T {

            var component = this.getComponentByClass(cls);
            if (component == null) {
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
        public hasComponent(com: IComponent): boolean {

            return this.components.indexOf(com) != -1;
        }

        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        public swapComponentsAt(index1: number, index2: number): void {

            assert(index1 >= 0 && index1 < this.numComponents, "第一个子组件的索引位置超出范围");
            assert(index2 >= 0 && index2 < this.numComponents, "第二个子组件的索引位置超出范围");

            var temp: IComponent = this.components[index1];
            this.components[index1] = this.components[index2];
            this.components[index2] = temp;
        }

        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        public swapComponents(a: IComponent, b: IComponent): void {

            assert(this.hasComponent(a), "第一个子组件不在容器中");
            assert(this.hasComponent(b), "第二个子组件不在容器中");

            this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
        }

        /**
         * 派发子组件事件
         * <p>事件广播给子组件</p>
         * @param event     事件
         * @param depth     广播深度
         */
        public dispatchChildrenEvent(event: Event, depth = 1): void {

            if (depth == 0)
                return;
            this.components.forEach(function (item: IComponent, ...args): void {
                item.dispatchEvent(event);
                item.dispatchChildrenEvent(event, depth - 1)
            });
        }

        //------------------------------------------
        //@protected
        //------------------------------------------

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void {

        }

        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void {

        }

        /**
         * 获取冒泡对象
         */
        protected getBubbleTargets(event: Event = null): IEventDispatcher[] {

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
        private _onAddedComponent(event: ComponentEvent): void {

            var data: { container: IComponent, child: IComponent } = event.data;
            if (data.child == this) {
                this._parentComponent = data.container;
                this.onBeAddedComponent(event);
            }
        }

        /**
         * 处理移除组件事件，此处为被移除，清空父组件
         */
        private _onRemovedComponent(event: ComponentEvent): void {

            var data: { container: IComponent, child: IComponent } = event.data;
            if (event.data.child == this) {
                this.onBeRemovedComponent(event);
                this._parentComponent = null;
            }
        }

    }

    /**
	 * 断言
	 * @b			判定为真的表达式
	 * @msg			在表达式为假时将输出的错误信息
	 * @author feng 2014-10-29
	 */
    function assert(b: boolean, msg: string = "assert"): void {
        if (!b)
            throw new Error(msg);
    }
}
