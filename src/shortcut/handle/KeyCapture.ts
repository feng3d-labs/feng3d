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
			input.addEventListener(inputType.KEY_DOWN, this.onKeydown, this);
			input.addEventListener(inputType.KEY_UP, this.onKeyup, this);

			this._boardKeyDic = {};
			this.defaultSupportKeys();

			//监听鼠标事件
			var mouseEvents = [ //
				inputType.DOUBLE_CLICK, //
				inputType.CLICK, //
				inputType.MOUSE_DOWN,
				inputType.MOUSE_UP,
				inputType.MIDDLE_CLICK,
				inputType.MIDDLE_MOUSE_DOWN,
				inputType.MIDDLE_MOUSE_UP,
				inputType.RIGHT_CLICK,
				inputType.RIGHT_MOUSE_DOWN,
				inputType.RIGHT_MOUSE_UP,
				inputType.MOUSE_MOVE,
				inputType.MOUSE_OVER,
				inputType.MOUSE_OUT,
			];
			for (var i = 0; i < mouseEvents.length; i++)
			{
				input.addEventListener(mouseEvents[i], this.onMouseOnce, this);
			}
			input.addEventListener(inputType.MOUSE_WHEEL, this.onMousewheel, this);
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
		private onMouseOnce(event: InputEvent): void
		{
			var mouseKey: string = event.type;
			this._keyState.pressKey(mouseKey, event);
			this._keyState.releaseKey(mouseKey, event);
		}

		/**
		 * 鼠标事件
		 */
		private onMousewheel(event: InputEvent): void
		{
			var mouseKey: string = event.type;
			this._keyState.pressKey(mouseKey, event);
			this._keyState.releaseKey(mouseKey, event);
		}

		/**
		 * 键盘按下事件
		 */
		private onKeydown(event: InputEvent): void
		{
			var boardKey: string = this.getBoardKey(event.keyCode);
			if (boardKey != null)
				this._keyState.pressKey(boardKey, event);
		}

		/**
		 * 键盘弹起事件
		 */
		private onKeyup(event: InputEvent): void
		{
			var boardKey: string = this.getBoardKey(event.keyCode);
			if (boardKey)
				this._keyState.releaseKey(boardKey, event);
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
