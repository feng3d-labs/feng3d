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
        private shortcut: ShortCut;

        /**
         * 构建
         * @param stage 舞台
         */
        constructor(shortcut: ShortCut)
        {
            this.shortcut = shortcut;
            this._keyState = shortcut.keyState;
            //
            if (!windowEventProxy)
            {
                return;
            }
            windowEventProxy.on('keydown', this.onKeydown, this);
            windowEventProxy.on('keyup', this.onKeyup, this);

            // 监听鼠标事件
            const mouseEvents = [ //
                'dblclick', //
                'click', //
                'mousedown',
                'mouseup',
                'mousemove',
                'mouseover',
                'mouseout',
            ];

            for (let i = 0; i < mouseEvents.length; i++)
            {
                windowEventProxy.on(mouseEvents[i] as any, this.onMouseOnce, this);
            }
            windowEventProxy.on('wheel', this.onMousewheel, this);
        }

        /**
         * 鼠标事件
         */
        private onMouseOnce(event: IEvent<MouseEvent>): void
        {
            if (!this.shortcut.enable)
            {
                return;
            }
            const mouseKey: string = event.type;

            this._keyState.pressKey(mouseKey, event.data);
            this._keyState.releaseKey(mouseKey, event.data);
        }

        /**
         * 鼠标事件
         */
        private onMousewheel(event: IEvent<WheelEvent>): void
        {
            if (!this.shortcut.enable)
            {
                return;
            }
            const mouseKey: string = event.type;

            this._keyState.pressKey(mouseKey, event.data);
            this._keyState.releaseKey(mouseKey, event.data);
        }

        /**
         * 键盘按下事件
         */
        private onKeydown(event: IEvent<KeyboardEvent>): void
        {
            if (!this.shortcut.enable)
            {
                return;
            }
            let boardKey: string = KeyBoard.getKey(event.data.keyCode);

            boardKey = boardKey || event.data.key;
            if (boardKey)
            {
                boardKey = boardKey.toLocaleLowerCase();
                this._keyState.pressKey(boardKey, event.data);
            }
            else
            {
                console.error(`无法识别按钮 ${event.data.key}`);
            }
        }

        /**
         * 键盘弹起事件
         */
        private onKeyup(event: IEvent<KeyboardEvent>): void
        {
            if (!this.shortcut.enable)
            {
                return;
            }
            let boardKey: string = KeyBoard.getKey(event.data.keyCode);

            boardKey = boardKey || event.data.key;
            if (boardKey)
            {
                boardKey = boardKey.toLocaleLowerCase();
                this._keyState.releaseKey(boardKey, event.data);
            }
            else
            {
                console.error(`无法识别按钮 ${event.data.key}`);
            }
        }
    }

}