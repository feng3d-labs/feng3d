module feng3d
{
	/**
	 * 快捷键命令事件
	 * @author feng 2016-4-27
	 */
	export class ShortCutEvent extends Event
	{
		/**
		 * 携带数据
		 */
		public data: InputEvent;

		/**
		 * 构建
		 * @param command		命令名称
		 */
		constructor(command: string, data: InputEvent)
		{
			super(command, data);
		}
	}
}
