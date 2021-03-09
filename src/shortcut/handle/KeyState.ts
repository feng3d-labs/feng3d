namespace feng3d
{

	/**
	 * 按键状态

	 */
	export class KeyState extends EventEmitter
	{
		/**
		 * 按键状态{key:键名称,value:是否按下}
		 */
		private _keyStateDic: {};

		/**
		 * 构建
		 */
		constructor()
		{
			super();
			this._keyStateDic = {};
		}

		/**
		 * 按下键
		 * @param key 	键名称
		 * @param data	携带数据
		 */
		pressKey(key: string, data: KeyboardEvent | WheelEvent | MouseEvent): void
		{
			// 处理鼠标中键与右键
			if (data instanceof MouseEvent)
			{
				if (["click", "mousedown", "mouseup"].indexOf(data.type) != -1)
				{
					key = ["", "middle", "right"][data.button] + data.type;
				}
			}
			this._keyStateDic[key] = true;
			this.emit(key, data);
		}

		/**
		 * 释放键
		 * @param key	键名称
		 * @param data	携带数据
		 */
		releaseKey(key: string, data: KeyboardEvent | WheelEvent | MouseEvent): void
		{
			// 处理鼠标中键与右键
			if (data instanceof MouseEvent)
			{
				if (["click", "mousedown", "mouseup"].indexOf(data.type) != -1)
				{
					key = ["", "middle", "right"][data.button] + data.type;
				}
			}
			this._keyStateDic[key] = false;
			this.emit(key, data);
		}

		/**
		 * 获取按键状态
		 * @param key 按键名称
		 */
		getKeyState(key: string): boolean
		{
			return !!this._keyStateDic[key];
		}
	}
}
