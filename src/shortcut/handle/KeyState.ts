namespace feng3d
{

	/**
	 * 按键状态
	 * @author feng 2016-4-26
	 */
	export class KeyState 
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
			this._keyStateDic = {};
		}

		/**
		 * 按下键
		 * @param key 	键名称
		 * @param data	携带数据
		 */
		pressKey(key: string, data: InputEvent): void
		{
			this._keyStateDic[key] = true;
			Event.dispatch(this,<any>key, data);
		}

		/**
		 * 释放键
		 * @param key	键名称
		 * @param data	携带数据
		 */
		releaseKey(key: string, data: InputEvent): void
		{
			this._keyStateDic[key] = false;
			Event.dispatch(this,<any>key, data);
		}

		/**
		 * 获取按键状态
		 * @param key 按键名称
		 */
		getKeyState(key: string):boolean
		{
			return !!this._keyStateDic[key];
		}
	}
}
