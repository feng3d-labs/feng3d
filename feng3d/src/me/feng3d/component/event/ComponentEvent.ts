module me.feng3d {

	/**
	 * 组件事件
	 * @author feng 2015-12-2
	 */
    export class ComponentEvent extends Event {
				
		/**
		 * 添加子组件事件
		 */
        public static ADDED_COMPONENT = "addedComponent";

		/**
		 * 被组件容器添加事件
		 */
        public static BE_ADDED_COMPONENT = "beAddedComponet";

		/**
		 * 移除子组件事件
		 */
        public static REMOVED_COMPONENT = "removedComponent";

		/**
		 * 被容器删除事件
		 */
        public static BE_REMOVED_COMPONENT = "beRemovedComponent";

		/**
		 * 数据
		 */
        data: { container: IComponent, child: IComponent };

		target:IComponent;

		/**
		 * 构建组件事件
		 */
        constructor(type: string, data: { container: IComponent, child: IComponent }, bubbles = false) {
            super(type, data, bubbles);
        }
    }
}
