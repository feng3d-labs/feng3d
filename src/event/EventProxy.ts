namespace feng3d
{
    /**
     * 代理 EventTarget, 处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    export class EventProxy<T> extends EventDispatcher
    {
        clientX = 0;
        clientY = 0;

        /**
         * 是否右击
         */
        rightmouse = false;

        keyCode: number;

        wheelDelta: number;

        private listentypes: string[] = [];

        private target: EventTarget;

        constructor(target: EventTarget)
        {
            super();
            this.target = target;
        }

        /**
         * 监听一次事件后将会被移除
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once<K extends keyof T>(type: K, listener: (event: T[K]) => void, thisObject?: any, priority?: number): void
        {
            super.once(type, listener, thisObject, priority)
        }

        /**
         * 添加监听
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on<K extends keyof T>(type: K, listener: (event: T[K]) => any, thisObject?: any, priority = 0, once = false)
        {
            super.on(type, listener, thisObject, priority, once);
            if (this.listentypes.indexOf(type) == -1)
            {
                this.listentypes.push(type);
                this.target.addEventListener(type, this.onMouseKey);
            }
        }

        /**
         * 移除监听
         * @param dispatcher 派发器
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         */
        off<K extends keyof T>(type?: K, listener?: (event: T[K]) => any, thisObject?: any)
        {
            super.off(type, listener, thisObject);
            if (!type)
            {
                this.listentypes.forEach(element =>
                {
                    this.target.removeEventListener(element, this.onMouseKey);
                });
                this.listentypes.length = 0;
            } else if (!this.has(type))
            {
                this.target.removeEventListener(type, this.onMouseKey);
                this.listentypes.splice(this.listentypes.indexOf(type), 1);
            }
        }

        /**
		 * 键盘按下事件
		 */
        private onMouseKey = (event) =>
        {
            if (event["clientX"] != undefined)
            {
                event = <MouseEvent>event;
                this.clientX = event.clientX;
                this.clientY = event.clientY;
            }

            if (event instanceof MouseEvent)
            {
                this.rightmouse = event.button == 2;
            }

            if (event instanceof KeyboardEvent)
            {
                this.keyCode = event.keyCode;
            }

            if (event instanceof WheelEvent)
            {
                this.wheelDelta = event.wheelDelta;
            }

            this.dispatchEvent(<any>event);
        }
    }

    /**
     * 键盘鼠标输入
     */
    export var windowEventProxy = new EventProxy<WindowEventMap>(window);
}