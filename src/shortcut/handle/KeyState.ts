module feng3d
{

	/**
	 * 按键状态
	 * @author feng 2016-4-26
	 */
	export class KeyState extends EventDispatcher
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
		public pressKey(key: string, data: InputEvent): void
		{
			this._keyStateDic[key] = true;
			this.dispatchEvent(new ShortCutEvent(key, data));
		}

		/**
		 * 释放键
		 * @param key	键名称
		 * @param data	携带数据
		 */
		public releaseKey(key: string, data: InputEvent): void
		{
			this._keyStateDic[key] = false;
			this.dispatchEvent(new ShortCutEvent(key, data));
		}

		/**
		 * 获取按键状态
		 * @param key 按键名称
		 */
		public getKeyState(key: string):boolean
		{
			return !!this._keyStateDic[key];
		}
	}
}
