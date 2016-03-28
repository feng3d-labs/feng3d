module feng3d {

	/**
	 * 添加组件事件数据
	 * @author feng 2015-12-2
	 */
    export class AddedComponentEventVO {
        public container: Component;
        public child: Component;

		/**
		 * 添加组件事件数据
		 * @param container			组件容器
		 * @param child				子组件
		 */
        constructor(container: Component, child: Component) {
            this.container = container;
            this.child = child;
        }
    }
}
