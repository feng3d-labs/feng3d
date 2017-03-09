module feng3d
{
	/**
	 * 初始化快捷键模块
	 * @author feng 2016-4-26
	 *
	 * <pre>
var shortcuts:Array = [ //
//在按下key1时触发命令command1
	{key: "key1", command: "command1", when: ""}, //
	 //在按下key1时触发状态命令改变stateCommand1为激活状态
	{key: "key1", stateCommand: "stateCommand1", when: "state1"}, //
	 //处于state1状态时按下key1触发命令command1
	{key: "key1", command: "command1", when: "state1"}, //
	//处于state1状态不处于state2时按下key1与没按下key2触发command1与command2，改变stateCommand1为激活状态，stateCommand2为非激活状态
	{key: "key1+ ! key2", command: "command1,command2", stateCommand: "stateCommand1,!stateCommand2", when: "state1+!state2"}, //
	];
//添加快捷键
shortCut.addShortCuts(shortcuts);
//监听命令
shortCut.addEventListener("run", function(e:Event):void
{
	trace("接受到命令：" + e.type);
});
	 * </pre>
	 */
	export class ShortCut extends EventDispatcher
	{
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
		 * 初始化快捷键模块
		 */
		constructor()
		{
			super();

			this.keyState = new KeyState();
			this.keyCapture = new KeyCapture(this)

			this.captureDic = {};
			this.stateDic = {};
		}

		/**
		 * 添加快捷键
		 * @param shortcuts		快捷键列表
		 */
		public addShortCuts(shortcuts: any[]): void
		{
			for (var i = 0; i < shortcuts.length; i++)
			{
				var shortcut = shortcuts[i];
				var shortcutUniqueKey: string = this.getShortcutUniqueKey(shortcut);
				this.captureDic[shortcutUniqueKey] = this.captureDic[shortcutUniqueKey] || new ShortCutCapture(this, shortcut.key, shortcut.command, shortcut.stateCommand, shortcut.when);
			}
		}

		/**
		 * 删除快捷键
		 * @param shortcuts		快捷键列表
		 */
		public removeShortCuts(shortcuts: any[]): void
		{
			for (var i = 0; i < shortcuts.length; i++)
			{
				var shortcutUniqueKey: string = this.getShortcutUniqueKey(shortcuts[i]);
				var shortCutCapture: ShortCutCapture = this.captureDic[shortcutUniqueKey];
				if (ShortCutCapture != null)
				{
					shortCutCapture.destroy();
				}
				delete this.captureDic[shortcutUniqueKey];
			}
		}

		/**
		 * 移除所有快捷键
		 */
		public removeAllShortCuts(): void
		{
			var keys = [];
			var key: string;
			for (key in this.captureDic)
			{
				keys.push(key);
			}

			keys.forEach(key =>
			{
				var shortCutCapture: ShortCutCapture = this.captureDic[key];
				shortCutCapture.destroy();
				delete this.captureDic[key];
			});
		}

		/**
		 * 激活状态
		 * @param state 状态名称
		 */
		public activityState(state: string): void
		{
			this.stateDic[state] = true;
		}

		/**
		 * 取消激活状态
		 * @param state 状态名称
		 */
		public deactivityState(state: string): void
		{
			delete this.stateDic[state];
		}

		/**
		 * 获取状态
		 * @param state 状态名称
		 */
		public getState(state: string):boolean
		{
			return !!this.stateDic[state];
		}

		/**
		 * 获取快捷键唯一字符串
		 */
		private getShortcutUniqueKey(shortcut: any): string
		{
			return shortcut.key + "," + shortcut.command + "," + shortcut.when;
		}
	}
}
