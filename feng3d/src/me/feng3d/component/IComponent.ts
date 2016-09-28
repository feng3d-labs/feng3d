module feng3d {
    /**
     * 组件接口
     * @author feng 2016-4-24
     */
    export interface IComponent extends IEventDispatcher {

        /**
         * 组件数量
         */
        numComponents: number;

        /**
         * 父组件
         */
        parentComponent: IComponent;

        /**
         * 添加组件
         * @param component 被添加组件
         */
        addComponent(component: IComponent): void;

        /**
		 * 添加组件到指定位置
		 * @param component		被添加的组件
		 * @param index			插入的位置
		 */
        addComponentAt(component: IComponent, index: number): void;

        /**
		 * 移除组件
		 * @param component 被移除组件
		 */
        removeComponent(component: IComponent): void;

        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): IComponent;

        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(com: IComponent): number;

        /**
        * 设置子组件的位置
        * @param component				子组件
        * @param index				    位置索引
        */
        setComponentIndex(component: IComponent, index: number): void;

        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): IComponent;

        /**
         * 根据组件名称获取组件
         * <p>注意：此处比较的是componentName而非name</p>
         * @param componentName		组件名称
         * @return 					获取到的组件
         */
        getComponentByName(componentName: String): IComponent;

        /**
        * 获取与给出组件名称相同的所有组件
        * <p>注意：此处比较的是componentName而非name</p>
        * @param componentName		组件名称
        * @return 					获取到的组件
        */
        getComponentsByName(componentName: String): IComponent[];

        /**
         * 根据类定义获取组件
         * <p>如果存在多个则返回第一个</p>
         * @param cls				类定义
         * @return
         */
        getComponentByClass<T extends IComponent>(cls: new (...args) => T): T;

        /**
         * 根据类定义查找组件
         * @param cls		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsByClass<T extends IComponent>(cls: new (...args) => T): T[];

        /**
         * 根据类定义获取或创建组件
         * <p>当不存在该类型对象时创建一个该组件并且添加到容器中</p>
         * @param cls
         * @return
         */
        getOrCreateComponentByClass<T extends IComponent>(cls: new (...args) => T): T;

        /**
        * 判断是否拥有组件
        * @param com	被检测的组件
        * @return		true：拥有该组件；false：不拥有该组件。
        */
        hasComponent(com: IComponent): boolean;

        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        swapComponentsAt(index1: number, index2: number): void;

        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        swapComponents(a: IComponent, b: IComponent): void;

        /**
         * 派发子组件事件
         * <p>事件广播给子组件</p>
         * @param event     事件
         * @param depth     广播深度
         */
        dispatchChildrenEvent(event: Event, depth: number): void;
    }
}