module feng3d.shortcut {

	/**
	 * 快捷键命令事件
	 * @author feng 2016-4-27
	 */
	export class ShortCutEvent extends Event {
		/**
		 * 携带数据
		 */
		public data: Object;

		/**
		 * 构建
		 * @param command		命令名称
		 */
		constructor(command: string, data: Object = null) {
			
			super(command, data);
		}
	}
}
