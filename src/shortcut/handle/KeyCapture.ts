module feng3d
{

	/**
	 * 按键捕获
	 * @author feng 2016-4-26
	 */
	export class KeyCapture
	{
		/**
		 * 键盘按键字典 （补充常量，a-z以及鼠标按键不必再次列出）
		 * 例如 boardKeyDic[17] = "ctrl";
		 */
		private _boardKeyDic: { [keyCode: number]: string };

		/**
		 * 捕获的按键字典
		 */
		private _mouseKeyDic = {};

		/**
		 * 按键状态
		 */
		private _keyState: KeyState;

		/**
		 * 构建
		 * @param stage		舞台
		 */
		constructor(shortCut: ShortCut)
		{
			this._keyState = shortCut.keyState;
			//
			input.on("keydown", this.onKeydown, this);
			input.on("keyup", this.onKeyup, this);

			this._boardKeyDic = {};
			this.defaultSupportKeys();

			//监听鼠标事件
			var mouseEvents: (keyof InputEventMap)[] = [ //
				"dblclick", //
				"click", //
				"mousedown",
				"mouseup",
				"middleclick",
				"middlemousedown",
				"middlemouseup",
				"rightclick",
				"rightmousedown",
				"rightmouseup",
				"mousemove",
				"mouseover",
				"mouseout",
			];
			for (var i = 0; i < mouseEvents.length; i++)
			{
				input.on(mouseEvents[i], this.onMouseOnce, this);
			}
			input.on("mousewheel", this.onMousewheel, this);
		}

		/**
		 * 默认支持按键
		 */
		private defaultSupportKeys(): void
		{
			this._boardKeyDic[17] = "ctrl";
			this._boardKeyDic[16] = "shift";
			this._boardKeyDic[32] = "escape";
			this._boardKeyDic[18] = "alt";
			this._boardKeyDic[46] = "del";
		}

		/**
		 * 鼠标事件
		 */
		private onMouseOnce(event: EventVO<any>): void
		{
			if (!shortcut.enable)
				return;
			var mouseKey: string = event.type;
			this._keyState.pressKey(mouseKey, event.data);
			this._keyState.releaseKey(mouseKey, event.data);
		}

		/**
		 * 鼠标事件
		 */
		private onMousewheel(event: EventVO<any>): void
		{
			if (!shortcut.enable)
				return;
			var mouseKey: string = event.type;
			this._keyState.pressKey(mouseKey, event.data);
			this._keyState.releaseKey(mouseKey, event.data);
		}

		/**
		 * 键盘按下事件
		 */
		private onKeydown(event: EventVO<any>): void
		{
			if (!shortcut.enable)
				return;
			var boardKey: string = this.getBoardKey(event.data.keyCode);
			if (boardKey != null)
				this._keyState.pressKey(boardKey, event.data);
		}

		/**
		 * 键盘弹起事件
		 */
		private onKeyup(event: EventVO<any>): void
		{
			if (!shortcut.enable)
				return;
			var boardKey: string = this.getBoardKey(event.data.keyCode);
			if (boardKey)
				this._keyState.releaseKey(boardKey, event.data);
		}

		/**
		 * 获取键盘按键名称
		 */
		private getBoardKey(keyCode: number): string
		{

			var boardKey = this._boardKeyDic[keyCode];
			if (boardKey == null && 65 <= keyCode && keyCode <= 90)
			{
				boardKey = String.fromCharCode(keyCode).toLocaleLowerCase();
			}
			return boardKey;
		}
	}
}
