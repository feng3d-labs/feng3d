module feng3d
{

	/**
	 * 组件事件
	 * @author feng 2015-12-2
	 */
	export class ComponentEvent extends Event
	{
		/**
		 * 添加子组件事件
		 */
		public static ADDED_COMPONENT = "addedComponent";

		/**
		 * 移除子组件事件
		 */
		public static REMOVED_COMPONENT = "removedComponent";

		/**
		 * 组件事件数据
		 */
		public data: { container: Component, child: Component };

        /**
         * 事件目标。
         */
		public target: Component;
	}
}
