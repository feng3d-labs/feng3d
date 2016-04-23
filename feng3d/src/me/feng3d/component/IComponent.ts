module feng3d {
    /**
     * 组件接口
     * @author feng 2016-4-24
     */
    export interface IComponent {
        /**
         * 组件名称
         */
        componentName: string;

        /**
         * 组件数量
         */
        numComponents: number;

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
    }
}