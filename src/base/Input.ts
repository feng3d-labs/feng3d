module feng3d
{
    /**
     * 鼠标键盘输入，处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    export class Input extends EventDispatcher
    {
        public clientX: number = 0;
        public clientY: number = 0;

        constructor()
        {
            super();

            var mouseKeyType = [
                "click", "dblclick",
                "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "mousewheel",
                "keydown", "keypress", "keyup"];
            for (var i = 0; i < mouseKeyType.length; i++)
            {
                window.addEventListener(mouseKeyType[i], this.onMouseKey.bind(this));
            }
        }

        /**
		 * 键盘按下事件
		 */
        private onMouseKey(event: MouseEvent | WheelEvent | KeyboardEvent): void
        {
            if (event["clientX"] != undefined)
            {
                event = <MouseEvent>event;
                this.clientX = event.clientX;
                this.clientY = event.clientY;
            }

            this.dispatchEvent(new InputEvent(event, this, true));
        }

        /**
         * 
         */
        public addEventListener(type: string, listener: (event: InputEvent) => void, thisObject: any, priority = 0): void
        {
            super.addEventListener(type, listener, thisObject, priority);
        }
    }

    export class InputEventType
    {
        /** 鼠标双击 */
        public DOUBLE_CLICK = "dblclick";
        /** 鼠标单击 */
        public CLICK = "click";
        /** 鼠标按下 */
        public MOUSE_DOWN = "mousedown";
        /** 鼠标弹起 */
        public MOUSE_UP = "mouseup";
        /** 鼠标中键单击 */
        public MIDDLE_CLICK = "middleclick";
        /** 鼠标中键按下 */
        public MIDDLE_MOUSE_DOWN = "middlemousedown";
        /** 鼠标中键弹起 */
        public MIDDLE_MOUSE_UP = "middlemouseup";
        /** 鼠标右键单击 */
        public RIGHT_CLICK = "rightclick";
        /** 鼠标右键按下 */
        public RIGHT_MOUSE_DOWN = "rightmousedown";
        /** 鼠标右键弹起 */
        public RIGHT_MOUSE_UP = "rightmouseup";
        /** 鼠标移动 */
        public MOUSE_MOVE = "mousemove";
        /** 鼠标移出 */
        public MOUSE_OUT = "mouseout";
        /** 鼠标移入 */
        public MOUSE_OVER = "mouseover";
        /** 鼠标滚动滚轮 */
        public MOUSE_WHEEL = "mousewheel";
        /** 键盘按下 */
        public KEY_DOWN = "keydown";
        /** 键盘按着 */
        public KEY_PRESS = "keypress";
        /** 键盘弹起 */
        public KEY_UP = "keyup";
    }

    export class InputEvent extends Event
    {
        public data: Input;

        public clientX: number;
        public clientY: number;

        public keyCode: number;

        public wheelDelta: number;

        constructor(event: WheelEvent | MouseEvent | KeyboardEvent, data: Input = null, bubbles = true)
        {
            super(event.type, null, true)
            if (event["clientX"] != undefined)
            {
                var mouseEvent = <MouseEvent>event;
                this.clientX = mouseEvent.clientX;
                this.clientY = mouseEvent.clientY;
                if (["click", "mousedown", "mouseup"].indexOf(mouseEvent.type) != -1)
                {
                    this["_type"] = ["", "middle", "right"][mouseEvent.button] + mouseEvent.type;
                }
            }
            if (event["keyCode"] != undefined)
            {
                var keyboardEvent = <KeyboardEvent>event;
                this.keyCode = keyboardEvent.keyCode;
            }
            if (event["wheelDelta"] != undefined)
            {
                var wheelEvent = <WheelEvent>event;
                this.wheelDelta = wheelEvent.wheelDelta;
            }
        }
    }
}