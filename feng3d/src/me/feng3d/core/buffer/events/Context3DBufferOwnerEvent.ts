module me.feng3d {

	/**
	 * 3D环境缓冲拥有者事件
	 * @author feng 2015-7-18
	 */
	export class Context3DBufferOwnerEvent extends Event {
		/**
		 * 添加3D环境缓冲事件
		 */
		public static ADD_CONTEXT3DBUFFER: string = "addContext3DBuffer";

		/**
		 * 移除3D环境缓冲事件
		 */
		public static REMOVE_CONTEXT3DBUFFER: string = "removeContext3DBuffer";

		/**
		 * 添加子项3D环境缓冲拥有者事件
		 */
		public static ADDCHILD_CONTEXT3DBUFFEROWNER: string = "addChildContext3DBufferOwner";

		/**
		 * 移除子项3D环境缓冲拥有者事件
		 */
		public static REMOVECHILD_CONTEXT3DBUFFEROWNER: string = "removeChildContext3DBufferOwner";

		/**
		 * 创建3D环境缓冲拥有者事件
		 * @param type 					事件的类型，可以作为 Event.type 访问。
		 * @param data					事件携带的数据
		 * @param bubbles 				确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
		 */
		constructor(type: string, data = null, bubbles: boolean = false) {
			super(type, data, bubbles);
		}
	}
}
