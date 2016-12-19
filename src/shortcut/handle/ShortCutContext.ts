module feng3d.shortcut {

	/**
	 * 快捷键环境
	 * @author feng 2016-6-6
	 */
	export class ShortCutContext {

		/**
		 * 命令派发器
		 */
		public commandDispatcher: IEventDispatcher;

		/**
		 * 按键状态
		 */
		public keyState: KeyState;

		/**
		 * 状态字典
		 */
		public stateDic: {};

		/**
		 * 按键捕获
		 */
		public keyCapture: KeyCapture;

		/**
		 * 捕获字典
		 */
		public captureDic: {};

		/**
		 * 构建快捷键环境
		 * @param stage 舞台
		 */
		constructor() {

			this.init();
		}

		/**
		 * 初始化快捷键模块
		 */
		public init(): void {

			this.keyState = new KeyState();
			this.keyCapture = new KeyCapture(this)
			this.commandDispatcher = new EventDispatcher();

			this.captureDic = {};
			this.stateDic = {};
		}

		/**
		 * 添加快捷键
		 * @param shortcuts		快捷键列表
		 */
		public addShortCuts(shortcuts: any[]): void {

			for (var i = 0; i < shortcuts.length; i++) {
				var shortcut = shortcuts[i];
				var shortcutUniqueKey: string = this.getShortcutUniqueKey(shortcut);
				this.captureDic[shortcutUniqueKey] = this.captureDic[shortcutUniqueKey] || new ShortCutCapture(this, shortcut.key, shortcut.command, shortcut.stateCommand, shortcut.when);
			}
		}

		/**
		 * 删除快捷键
		 * @param shortcuts		快捷键列表
		 */
		public removeShortCuts(shortcuts: any[]): void {

			for (var i = 0; i < shortcuts.length; i++) {
				var shortcutUniqueKey: string = this.getShortcutUniqueKey(shortcuts[i]);
				var shortCutCapture: ShortCutCapture = this.captureDic[shortcutUniqueKey];
				if (ShortCutCapture != null) {
					shortCutCapture.destroy();
				}
				delete this.captureDic[shortcutUniqueKey];
			}
		}

		/**
		 * 移除所有快捷键
		 */
		public removeAllShortCuts(): void {

			var keys = [];
			var key: string;
			for (key in this.captureDic) {
				keys.push(key);
			}

			keys.forEach(key => {
				var shortCutCapture: ShortCutCapture = this.captureDic[key];
				shortCutCapture.destroy();
				delete this.captureDic[key];
			});
		}

		/**
		 * 激活状态
		 * @param state 状态名称
		 */
		public activityState(state: string): void {

			this.stateDic[state] = true;
		}

		/**
		 * 取消激活状态
		 * @param state 状态名称
		 */
		public deactivityState(state: string): void {

			delete this.stateDic[state];
		}

		/**
		 * 获取状态
		 * @param state 状态名称
		 */
		public getState(state: string): Boolean {

			return !!this.stateDic[state];
		}

		/**
		 * 获取快捷键唯一字符串
		 */
		private getShortcutUniqueKey(shortcut: any): string {

			return shortcut.key + "," + shortcut.command + "," + shortcut.when;
		}
	}
}
