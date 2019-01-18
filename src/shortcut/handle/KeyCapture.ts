namespace feng3d
{

	/**
	 * 按键捕获

	 */
	export class KeyCapture
	{
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
			windowEventProxy.on("keydown", this.onKeydown, this);
			windowEventProxy.on("keyup", this.onKeyup, this);

			//监听鼠标事件
			var mouseEvents = [ //
				"dblclick", //
				"click", //
				"mousedown",
				"mouseup",
				"mousemove",
				"mouseover",
				"mouseout",
			];
			for (var i = 0; i < mouseEvents.length; i++)
			{
				windowEventProxy.on(<any>mouseEvents[i], this.onMouseOnce, this);
			}
			windowEventProxy.on("wheel", this.onMousewheel, this);
		}

		/**
		 * 鼠标事件
		 */
		private onMouseOnce(event: MouseEvent): void
		{
			if (!shortcut.enable)
				return;
			var mouseKey: string = event.type;
			this._keyState.pressKey(mouseKey, event);
			this._keyState.releaseKey(mouseKey, event);
		}

		/**
		 * 鼠标事件
		 */
		private onMousewheel(event: WheelEvent): void
		{
			if (!shortcut.enable)
				return;
			var mouseKey: string = event.type;
			this._keyState.pressKey(mouseKey, event);
			this._keyState.releaseKey(mouseKey, event);
		}

		/**
		 * 键盘按下事件
		 */
		private onKeydown(event: KeyboardEvent): void
		{
			if (!shortcut.enable)
				return;
			var boardKey: string = KeyBoard.getKey(event.keyCode);
			if (boardKey != null)
				this._keyState.pressKey(boardKey, event);
		}

		/**
		 * 键盘弹起事件
		 */
		private onKeyup(event: KeyboardEvent): void
		{
			if (!shortcut.enable)
				return;
			var boardKey: string = KeyBoard.getKey(event.keyCode);
			if (boardKey)
				this._keyState.releaseKey(boardKey, event);
		}
	}
}
