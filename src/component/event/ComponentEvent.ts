namespace feng3d
{

	/**
	 * 组件事件
	 * @author feng 2015-12-2
	 */
	export class ComponentEvent
	{
		/**
		 * 添加子组件事件
		 */
		static ADDED_COMPONENT = "addedComponent";

		/**
		 * 移除子组件事件
		 */
		static REMOVED_COMPONENT = "removedComponent";

		/**
		 * 组件事件数据
		 */
		data: { container: GameObject, child: Component };

        /**
         * 事件目标。
         */
		target: Component;
	}
}
