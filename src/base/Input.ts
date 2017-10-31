module feng3d
{
    export interface InputEventMap
    {
        /** 鼠标双击 */
        dblclick: InputEvent;
        /** 鼠标单击 */
        click: InputEvent;
        /** 鼠标按下 */
        mousedown: InputEvent;
        /** 鼠标弹起 */
        mouseup: InputEvent;
        /** 鼠标中键单击 */
        middleclick: InputEvent;
        /** 鼠标中键按下 */
        middlemousedown: InputEvent;
        /** 鼠标中键弹起 */
        middlemouseup: InputEvent;
        /** 鼠标右键单击 */
        rightclick: InputEvent;
        /** 鼠标右键按下 */
        rightmousedown: InputEvent;
        /** 鼠标右键弹起 */
        rightmouseup: InputEvent;
        /** 鼠标移动 */
        mousemove: InputEvent;
        /** 鼠标移出 */
        mouseout: InputEvent;
        /** 鼠标移入 */
        mouseover: InputEvent;
        /** 鼠标滚动滚轮 */
        mousewheel: InputEvent;
        /** 键盘按下 */
        keydown: InputEvent;
        /** 键盘按着 */
        keypress: InputEvent;
        /** 键盘弹起 */
        keyup: InputEvent;
    }

    export interface Input
    {
        /**
         * 监听一次事件后将会被移除
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once<K extends keyof InputEventMap>(type: K, listener: (event: EventVO<InputEventMap[K]>) => void, thisObject?: any, priority?: number): void;

        /**
		 * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
		 * @param type                      事件的类型。类型区分大小写。
		 * @param data                      事件携带的自定义数据。
		 * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch<K extends keyof InputEventMap>(type: K, data?: InputEventMap[K], bubbles?: boolean);

        /**
		 * 检查 Event 对象是否为特定事件类型注册了任何侦听器. 
		 *
		 * @param type		事件的类型。
		 * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        has<K extends keyof InputEventMap>(type: K): boolean;

        /**
         * 添加监听
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on<K extends keyof InputEventMap>(type: K, listener: (event: EventVO<InputEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);

        /**
         * 移除监听
         * @param dispatcher 派发器
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         */
        off<K extends keyof InputEventMap>(type?: K, listener?: (event: EventVO<InputEventMap[K]>) => any, thisObject?: any);
    }

    /**
     * 鼠标键盘输入，处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    export class Input extends Event
    {
        clientX = 0;
        clientY = 0;

        /**
         * 是否右击
         */
        rightmouse = false;

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

            if (event instanceof MouseEvent)
            {
                input.rightmouse = event.button == 2;
            }

            var inputEvent = new InputEvent(event);
            this.dispatch(inputEvent.type, inputEvent, true);
        }
    }

    export class InputEvent
    {
        clientX: number;
        clientY: number;

        keyCode: number;

        wheelDelta: number;

        event: WheelEvent | MouseEvent | KeyboardEvent;

        type: keyof InputEventMap;

        constructor(event: WheelEvent | MouseEvent | KeyboardEvent)
        {
            this.event = event;
            this.type = <any>event.type;
            if (event instanceof MouseEvent)
            {
                this.clientX = event.clientX;
                this.clientY = event.clientY;
                if (["click", "mousedown", "mouseup"].indexOf(event.type) != -1)
                {
                    var t = ["", "middle", "right"][event.button] + event.type;
                    this.type = <any>t;
                }
            }
            if (event instanceof KeyboardEvent)
            {
                this.keyCode = event.keyCode;
            }
            if (event instanceof WheelEvent)
            {
                this.wheelDelta = event.wheelDelta;
            }
        }
    }

    /**
     * 键盘鼠标输入
     */
    export var input = new Input();
}