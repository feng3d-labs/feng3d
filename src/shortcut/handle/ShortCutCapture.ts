namespace feng3d
{

	/**
	 * 快捷键捕获
	 */
	export class ShortCutCapture
	{
		/**
		 * 快捷键环境
		 */
		private _shortCut: ShortCut;

		/**
		 * 快捷键
		 */
		private _key: string;

		/**
		 * 要执行的命令名称
		 */
		private _command: string | undefined;

		/**
		 * 可执行的状态命令
		 */
		private _stateCommand: string | undefined;

		/**
		 * 快捷键处于活动状态的条件
		 */
		private _when: string | undefined;

		/**
		 * 按键状态
		 */
		private _keyState: KeyState;

		/**
		 * 按键列表
		 */
		private _keys: Key[];

		/**
		 * 状态列表
		 */
		private _states: State[];

		/**
		 * 命令列表
		 */
		private _commands: string[];

		/**
		 * 命令列表
		 */
		private _stateCommands: StateCommand[];

		/**
		 * 构建快捷键捕获
		 * @param shortCut				快捷键环境
		 * @param key					快捷键；用“+”连接多个按键，“!”表示没按下某键；例如 “a+!b”表示按下“a”与没按下“b”时触发。
		 * @param command				要执行的command的id；使用“,”连接触发多个命令；例如 “commandA,commandB”表示满足触发条件后依次执行commandA与commandB命令。
		 * @param stateCommand			要执行的状态命令id；使用“,”连接触发多个状态命令，没带“!”表示激活该状态，否则表示使其处于非激活状态；例如 “stateA,!stateB”表示满足触发条件后激活状态“stateA，使“stateB处于非激活状态。
		 * @param when					快捷键激活的条件；使用“+”连接多个状态，没带“!”表示需要处于激活状态，否则需要处于非激活状态； 例如 “stateA+!stateB”表示stateA处于激活状态且stateB处于非激活状态时会判断按键是否满足条件。
		 */
		constructor(shortCut: ShortCut, key: string, command?: string, stateCommand?: string, when?: string)
		{
			this._shortCut = shortCut;
			this._keyState = shortCut.keyState;
			this._key = key;
			this._command = command;
			this._stateCommand = stateCommand;
			this._when = when;

			this._keys = this.getKeys(key);
			this._states = this.getStates(when);
			this._commands = this.getCommands(command);
			this._stateCommands = this.getStateCommand(stateCommand);

			this.init();
		}

		/**
		 * 初始化
		 */
		private init(): void
		{
			for (var i = 0; i < this._keys.length; i++)
			{
				this._keyState.on(this._keys[i].key, this.onCapture, this);
			}
		}

		/**
		 * 处理捕获事件
		 */
		private onCapture(event: Event<any>): void
		{
			var inWhen = this.checkActivityStates(this._states);
			var pressKeys = this.checkActivityKeys(this._keys);

			if (pressKeys && inWhen)
			{
				this.dispatchCommands(this._commands, event);
				this.executeStateCommands(this._stateCommands);
			}
		}

		/**
		 * 派发命令
		 */
		private dispatchCommands(commands: string[], data: Event<any>): void
		{
			for (var i = 0; i < commands.length; i++)
			{
				this._shortCut.emit(commands[i], data);
			}
		}

		/**
		 * 执行状态命令
		 */
		private executeStateCommands(stateCommands: StateCommand[]): void
		{
			for (var i = 0; i < stateCommands.length; i++)
			{
				var stateCommand: StateCommand = stateCommands[i];
				if (stateCommand.not)
					this._shortCut.deactivityState(stateCommand.state);
				else
					this._shortCut.activityState(stateCommand.state);
			}
		}

		/**
		 * 检测快捷键是否处于活跃状态
		 */
		private checkActivityStates(states: State[]): boolean
		{
			for (var i = 0; i < states.length; i++)
			{
				if (!this.getState(states[i]))
					return false;
			}
			return true;
		}

		/**
		 * 获取是否处于指定状态中（支持一个！取反）
		 * @param state 状态名称
		 */
		private getState(state: State): boolean
		{

			var result = this._shortCut.getState(state.state);
			if (state.not)
			{
				result = !result;
			}
			return result;
		}

		/**
		 * 检测是否按下给出的键
		 * @param keys 按键数组
		 */
		private checkActivityKeys(keys: Key[]): boolean
		{

			for (var i = 0; i < keys.length; i++)
			{
				if (!this.getKeyValue(keys[i]))
					return false;
			}
			return true;
		}

		/**
		 * 获取按键状态（true：按下状态，false：弹起状态）
		 */
		private getKeyValue(key: Key): boolean
		{

			var value = this._keyState.getKeyState(key.key);

			if (key.not)
			{
				value = !value;
			}

			return value;
		}

		/**
		 * 获取状态列表
		 * @param when		状态字符串
		 */
		private getStates(when?: string): State[]
		{
			var states: State[] = [];
			if (!when)
				return states;
			var state: string = when.trim();
			if (state.length == 0)
			{
				return states;
			}

			var stateStrs = state.split("+");
			for (var i = 0; i < stateStrs.length; i++)
			{
				states.push(new State(stateStrs[i]));
			}

			return states;
		}

		/**
		 * 获取键列表
		 * @param key		快捷键
		 */
		private getKeys(key: string): Key[]
		{
			var keyStrs = key.split("+");
			var keys: Key[] = [];
			for (var i = 0; i < keyStrs.length; i++)
			{
				keys.push(new Key(keyStrs[i]));
			}
			return keys;
		}

		/**
		 * 获取命令列表
		 * @param command	命令
		 */
		private getCommands(command?: string): string[]
		{
			var commands: string[] = [];
			if (!command)
				return commands;

			command = command.trim();
			var commandStrs = command.split(",");
			for (var i = 0; i < commandStrs.length; i++)
			{
				var commandStr: string = commandStrs[i].trim();
				if (commandStr.length > 0)
				{
					commands.push(commandStr);
				}
			}

			return commands;
		}

		/**
		 * 获取状态命令列表
		 * @param stateCommand	状态命令
		 */
		private getStateCommand(stateCommand?: string): StateCommand[]
		{
			var stateCommands: StateCommand[] = [];
			if (!stateCommand)
				return stateCommands;

			stateCommand = stateCommand.trim();
			var stateCommandStrs = stateCommand.split(",");
			for (var i = 0; i < stateCommandStrs.length; i++)
			{
				var commandStr: string = stateCommandStrs[i].trim();
				if (commandStr.length > 0)
				{
					stateCommands.push(new StateCommand(commandStr));
				}
			}

			return stateCommands;
		}

		/**
		 * 销毁
		 */
		destroy(): void
		{
			for (var i = 0; i < this._keys.length; i++)
			{
				this._keyState.off(this._keys[i].key, this.onCapture, this);
			}
			this._shortCut = <any>null;
			this._keys = <any>null;
			this._states = <any>null;
		}
	}

	/**
	 * 按键
	 */
	class Key
	{
		/**
		 * 是否取反
		 */
		not: boolean;

		/**
		 * 状态名称
		 */
		key: string;

		constructor(key: string)
		{
			key = key.trim();
			if (key.charAt(0) == "!")
			{
				this.not = true;
				key = key.substr(1).trim();
			}
			this.key = key;
		}
	}

	/**
	 * 状态
	 */
	class State
	{
		/**
		 * 是否取反
		 */
		not: boolean;

		/**
		 * 状态名称
		 */
		state: string;

		constructor(state: string)
		{
			state = state.trim();
			if (state.charAt(0) == "!")
			{
				this.not = true;
				state = state.substr(1).trim();
			}
			this.state = state;
		}
	}

	/**
	 * 状态命令
	 */
	class StateCommand
	{
		/**
		 * 是否取反
		 */
		not: boolean;

		/**
		 * 状态名称
		 */
		state: string;

		constructor(state: string)
		{
			state = state.trim();
			if (state.charAt(0) == "!")
			{
				this.not = true;
				state = state.substr(1).trim();
			}
			this.state = state;
		}
	}

}
