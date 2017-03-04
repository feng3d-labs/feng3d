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
        public readonly DOUBLE_CLICK = "dblclick";
        /** 鼠标单击 */
        public readonly CLICK = "click";
        /** 鼠标按下 */
        public readonly MOUSE_DOWN = "mousedown";
        /** 鼠标弹起 */
        public readonly MOUSE_UP = "mouseup";
        /** 鼠标中键单击 */
        public readonly MIDDLE_CLICK = "middleclick";
        /** 鼠标中键按下 */
        public readonly MIDDLE_MOUSE_DOWN = "middlemousedown";
        /** 鼠标中键弹起 */
        public readonly MIDDLE_MOUSE_UP = "middlemouseup";
        /** 鼠标右键单击 */
        public readonly RIGHT_CLICK = "rightclick";
        /** 鼠标右键按下 */
        public readonly RIGHT_MOUSE_DOWN = "rightmousedown";
        /** 鼠标右键弹起 */
        public readonly RIGHT_MOUSE_UP = "rightmouseup";
        /** 鼠标移动 */
        public readonly MOUSE_MOVE = "mousemove";
        /** 鼠标移出 */
        public readonly MOUSE_OUT = "mouseout";
        /** 鼠标移入 */
        public readonly MOUSE_OVER = "mouseover";
        /** 鼠标滚动滚轮 */
        public readonly MOUSE_WHEEL = "mousewheel";
        /** 键盘按下 */
        public readonly KEY_DOWN = "keydown";
        /** 键盘按着 */
        public readonly KEY_PRESS = "keypress";
        /** 键盘弹起 */
        public readonly KEY_UP = "keyup";
    }

    export class InputEvent extends Event
    {
        public data: Input;

        public clientX: number;
        public clientY: number;

        public keyCode: number;

        constructor(event: MouseEvent | WheelEvent | KeyboardEvent, data: Input = null, bubbles = true)
        {
            super(event.type, null, true)
            if (event["clientX"] != undefined)
            {
                event = <MouseEvent>event;
                this.clientX = event.clientX;
                this.clientY = event.clientY;
                if (["click", "mousedown", "mouseup"].indexOf(event.type) != -1)
                {
                    this["_type"] = ["", "middle", "right"][event.button] + event.type;
                }
            }
            if (event["keyCode"] != undefined)
            {
                event = <KeyboardEvent>event;
                this.keyCode = event.keyCode;
            }
        }
    }
}