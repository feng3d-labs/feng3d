module feng3d.shortcut {

	/**
	 * 按键状态
	 * @author feng 2016-4-26
	 */
	export class KeyState extends EventDispatcher {
		/**
		 * 按键状态{key:键名称,value:是否按下}
		 */
		private keyStateDic: {};

		/**
		 * 构建
		 */
		constructor() {
			
			super();
			this.keyStateDic = {};
		}

		/**
		 * 按下键
		 * @param key 	键名称
		 * @param data	携带数据
		 */
		public pressKey(key: string, data: Object = null): void {
			
			this.keyStateDic[key] = true;
			this.dispatchEvent(new ShortCutEvent(key, data));
		}

		/**
		 * 释放键
		 * @param key	键名称
		 * @param data	携带数据
		 */
		public releaseKey(key: string, data: Object = null): void {

			this.keyStateDic[key] = false;
			this.dispatchEvent(new ShortCutEvent(key, data));
		}

		/**
		 * 获取按键状态
		 * @param key 按键名称
		 */
		public getKeyState(key: string): Boolean {

			return !!this.keyStateDic[key];
		}
	}
}
