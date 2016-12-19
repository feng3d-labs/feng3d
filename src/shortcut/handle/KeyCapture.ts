module feng3d.shortcut {

	/**
	 * 按键捕获
	 * @author feng 2016-4-26
	 */
	export class KeyCapture {
		/**
		 * 键盘按键字典 （补充常量，a-z以及鼠标按键不必再次列出）
		 * 例如 boardKeyDic[Keyboard.CONTROL] = "ctrl";
		 */
		private boardKeyDic: {};

		/**
		 * 捕获的按键字典
		 */
		private mouseKeyDic = {};

		/**
		 * 快捷键环境
		 */
		private shortCutContext: ShortCutContext;

		/**
		 * 按键状态
		 */
		private keyState: KeyState;

		/**
		 * 构建
		 * @param stage		舞台
		 */
		constructor(shortCutContext: ShortCutContext) {

			this.keyState = shortCutContext.keyState;
			//
			window.addEventListener("keydown", this.onKeydown.bind(this));
			window.addEventListener("keyup", this.onKeyup.bind(this));

			this.boardKeyDic = {};
			this.defaultSupportKeys();

			//监听鼠标事件
			var mouseEvents = [ //
				"click", //
				"dblclick", //
				"mousedown", //
				"mousemove", //
				"mouseout", //
				"mouseover", //
				"mouseup", //
			];
			for (var i = 0; i < mouseEvents.length; i++) {
				window.addEventListener(mouseEvents[i], this.onMouseOnce.bind(this));
			}
			window.addEventListener("mousewheel", this.onMousewheel.bind(this));
		}

		/**
		 * 默认支持按键
		 */
		private defaultSupportKeys(): void {

			this.boardKeyDic[17] = "ctrl";
			this.boardKeyDic[16] = "shift";
			this.boardKeyDic[32] = "escape";
			this.boardKeyDic[18] = "alt";
		}

		/**
		 * 鼠标事件
		 */
		private onMouseOnce(event: MouseEvent): void {

			var mouseKey: string = event.type;
			this.keyState.pressKey(mouseKey, event);
			this.keyState.releaseKey(mouseKey, event);
		}

		/**
		 * 鼠标事件
		 */
		private onMousewheel(event: WheelEvent): void {

			var mouseKey: string = event.type;
			this.keyState.pressKey(mouseKey, event);
			this.keyState.releaseKey(mouseKey, event);
		}

		/**
		 * 键盘按下事件
		 */
		private onKeydown(event: KeyboardEvent): void {

			var boardKey: string = this.getBoardKey(event.keyCode);
			if (boardKey != null)
				this.keyState.pressKey(boardKey, event);
		}

		/**
		 * 键盘弹起事件
		 */
		private onKeyup(event: KeyboardEvent): void {

			var boardKey: string = this.getBoardKey(event.keyCode);
			if (boardKey)
				this.keyState.releaseKey(boardKey, event);
		}

		/**
		 * 获取键盘按键名称
		 */
		private getBoardKey(keyCode: number): string {

			var boardKey: string = this.boardKeyDic[keyCode];
			if (boardKey == null && 65 <= keyCode && keyCode <= 90) {
				boardKey = String.fromCharCode(keyCode).toLocaleLowerCase();
			}
			return boardKey;
		}
	}
}
