declare namespace feng3d {
    interface InputEventMap {
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
    interface Input {
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
        dispatch<K extends keyof InputEventMap>(type: K, data?: InputEventMap[K], bubbles?: boolean): any;
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
        on<K extends keyof InputEventMap>(type: K, listener: (event: EventVO<InputEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         */
        off<K extends keyof InputEventMap>(type?: K, listener?: (event: EventVO<InputEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * 鼠标键盘输入，处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    class Input extends Event {
        clientX: number;
        clientY: number;
        constructor();
        /**
         * 键盘按下事件
         */
        private onMouseKey(event);
    }
    class InputEvent {
        clientX: number;
        clientY: number;
        keyCode: number;
        wheelDelta: number;
        type: keyof InputEventMap;
        constructor(event: WheelEvent | MouseEvent | KeyboardEvent);
    }
    /**
     * 键盘鼠标输入
     */
    var input: Input;
}
