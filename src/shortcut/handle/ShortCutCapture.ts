module feng3d.shortcut {

	/**
	 * 快捷键捕获
	 * @author feng 2016-4-26
	 */
	export class ShortCutCapture {
		/**
		 * 快捷键环境
		 */
		private shortCutContext: ShortCutContext;

		/**
		 * 快捷键
		 */
		private key: string;

		/**
		 * 要执行的命令名称
		 */
		private command: string;

		/**
		 * 可执行的状态命令
		 */
		private stateCommand: string;

		/**
		 * 快捷键处于活动状态的条件
		 */
		private when: string;

		/**
		 * 按键状态
		 */
		private keyState: KeyState;

		/**
		 * 按键列表
		 */
		private keys: Key[];

		/**
		 * 状态列表
		 */
		private states: State[];

		/**
		 * 命令列表
		 */
		private commands: string[];

		/**
		 * 命令列表
		 */
		private stateCommands: StateCommand[];

		/**
		 * 构建快捷键捕获
		 * @param shortCutContext		快捷键环境
		 * @param key					快捷键
		 * @param command				要执行的命令名称
		 * @param stateCommand			可执行的状态命令
		 * @param when					快捷键处于活动状态的条件
		 */
		constructor(shortCutContext: ShortCutContext, key: string, command: string = null, stateCommand: string = null, when: string = null) {

			this.shortCutContext = shortCutContext;
			this.keyState = shortCutContext.keyState;
			this.key = key;
			this.command = command;
			this.stateCommand = stateCommand;
			this.when = when;

			this.keys = this.getKeys(key);
			this.states = this.getStates(when);
			this.commands = this.getCommands(command);
			this.stateCommands = this.getStateCommand(stateCommand);

			this.init();
		}

		/**
		 * 初始化
		 */
		private init(): void {

			for (var i = 0; i < this.keys.length; i++) {
				this.keyState.addEventListener(this.keys[i].key, this.onCapture, this);
			}
		}

		/**
		 * 处理捕获事件
		 */
		private onCapture(event: ShortCutEvent): void {

			var inWhen: Boolean = this.checkActivityStates(this.states);
			var pressKeys: Boolean = this.checkActivityKeys(this.keys);

			if (pressKeys && inWhen) {
				this.dispatchCommands(this.commands, event.data);
				this.executeStateCommands(this.stateCommands);
			}
		}

		/**
		 * 派发命令
		 */
		private dispatchCommands(commands: string[], data: Object): void {

			for (var i = 0; i < commands.length; i++) {
				this.shortCutContext.commandDispatcher.dispatchEvent(new ShortCutEvent(commands[i], data));
			}
		}

		/**
		 * 执行状态命令
		 */
		private executeStateCommands(stateCommands: StateCommand[]): void {

			for (var i = 0; i < stateCommands.length; i++) {
				var stateCommand: StateCommand = stateCommands[i];
				if (stateCommand.not)
					this.shortCutContext.deactivityState(stateCommand.state);
				else
					this.shortCutContext.activityState(stateCommand.state);
			}
		}

		/**
		 * 检测快捷键是否处于活跃状态
		 */
		private checkActivityStates(states: State[]): Boolean {

			for (var i = 0; i < states.length; i++) {
				if (!this.getState(states[i]))
					return false;
			}
			return true;
		}

		/**
		 * 获取是否处于指定状态中（支持一个！取反）
		 * @param state 状态名称
		 */
		private getState(state: State): Boolean {

			var result: Boolean = this.shortCutContext.getState(state.state);
			if (state.not) {
				result = !result;
			}
			return result;
		}

		/**
		 * 检测是否按下给出的键
		 * @param keys 按键数组
		 */
		private checkActivityKeys(keys: Key[]): Boolean {

			for (var i = 0; i < keys.length; i++) {
				if (!this.getKeyValue(keys[i]))
					return false;
			}
			return true;
		}

		/**
		 * 获取按键状态（true：按下状态，false：弹起状态）
		 */
		private getKeyValue(key: Key): Boolean {

			var value: Boolean = this.keyState.getKeyState(key.key);

			if (key.not) {
				value = !value;
			}

			return value;
		}

		/**
		 * 获取状态列表
		 * @param when		状态字符串
		 */
		private getStates(when: string): State[] {

			var states: State[] = [];
			if (when == null)
				return states;
			var state: string = when.trim();
			if (state.length == 0) {
				return states;
			}

			var stateStrs = state.split("+");
			for (var i = 0; i < stateStrs.length; i++) {
				states.push(new State(stateStrs[i]));
			}

			return states;
		}

		/**
		 * 获取键列表
		 * @param key		快捷键
		 */
		private getKeys(key: string): Key[] {

			var keyStrs = key.split("+");
			var keys: Key[] = [];
			for (var i = 0; i < keyStrs.length; i++) {
				keys.push(new Key(keyStrs[i]));
			}

			return keys;
		}

		/**
		 * 获取命令列表
		 * @param command	命令
		 */
		private getCommands(command: string): string[] {

			var commands: string[] = [];
			if (command == null)
				return commands;

			command = command.trim();
			var commandStrs = command.split(",");
			for (var i = 0; i < commandStrs.length; i++) {
				var commandStr: string = commandStrs[i].trim();
				if (commandStr.length > 0) {
					commands.push(commandStr);
				}
			}

			return commands;
		}

		/**
		 * 获取状态命令列表
		 * @param stateCommand	状态命令
		 */
		private getStateCommand(stateCommand: string): StateCommand[] {

			var stateCommands: StateCommand[] = [];
			if (stateCommand == null)
				return stateCommands;

			stateCommand = stateCommand.trim();
			var stateCommandStrs = stateCommand.split(",");
			for (var i = 0; i < stateCommandStrs.length; i++) {
				var commandStr: string = stateCommandStrs[i].trim();
				if (commandStr.length > 0) {
					stateCommands.push(new StateCommand(commandStr));
				}
			}

			return stateCommands;
		}

		/**
		 * 销毁
		 */
		public destroy(): void {

			for (var i = 0; i < this.keys.length; i++) {
				this.keyState.removeEventListener(this.keys[i].key, this.onCapture, this);
			}
			this.shortCutContext = null;
			this.keys = null;
			this.states = null;
		}
	}
}

/**
 * 按键
 * @author feng 2016-6-6
 */
class Key {
	/**
	 * 是否取反
	 */
	public not: Boolean;

	/**
	 * 状态名称
	 */
	public key: string;

	constructor(key: string) {

		key = key.trim();
		if (key.charAt(0) == "!") {
			this.not = true;
			key = key.substr(1).trim();
		}
		this.key = key;
	}
}

/**
 * 状态
 * @author feng 2016-6-6
 */
class State {
	/**
	 * 是否取反
	 */
	public not: Boolean;

	/**
	 * 状态名称
	 */
	public state: string;

	constructor(state: string) {

		state = state.trim();
		if (state.charAt(0) == "!") {
			this.not = true;
			state = state.substr(1).trim();
		}
		this.state = state;
	}
}

/**
 * 状态命令
 * @author feng 2016-6-6
 */
class StateCommand {
	/**
	 * 是否取反
	 */
	public not: Boolean;

	/**
	 * 状态名称
	 */
	public state: string;

	constructor(state: string) {

		state = state.trim();
		if (state.charAt(0) == "!") {
			this.not = true;
			state = state.substr(1).trim();
		}
		this.state = state;
	}
}
