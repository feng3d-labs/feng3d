namespace feng3d
{
    /**
     * 代理 EventTarget, 处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    export class EventProxy<T> extends EventDispatcher
    {
        pageX = 0;
        pageY = 0;
        clientX = 0;
        clientY = 0;

        /**
         * 是否右击
         */
        rightmouse = false;

        key: string = "";

        keyCode: number = 0;

        wheelDelta: number = 0;

        private listentypes: string[] = [];

        get target()
        {
            return this._target;
        }
        set target(v)
        {
            if (this._target == v) return;
            if (this._target)
            {
                this.listentypes.forEach(element =>
                {
                    this._target.removeEventListener(element, this.onMouseKey);
                });
            }
            this._target = v;
            if (this._target)
            {
                this.listentypes.forEach(element =>
                {
                    this._target.addEventListener(element, this.onMouseKey);
                });
            }
        }

        private _target: EventTarget;

        constructor(target?: EventTarget)
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
            this.on(type, listener, thisObject, priority, true)
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
                this._target.addEventListener(type, this.onMouseKey);
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
                    this._target.removeEventListener(element, this.onMouseKey);
                });
                this.listentypes.length = 0;
            } else if (!this.has(type))
            {
                this._target.removeEventListener(type, this.onMouseKey);
                this.listentypes.splice(this.listentypes.indexOf(type), 1);
            }
        }

        /**
		 * 键盘按下事件
		 */
        private onMouseKey = (event) =>
        {
            // this.clear();

            if (event["clientX"] != undefined)
            {
                event = <MouseEvent>event;
                this.clientX = event.clientX;
                this.clientY = event.clientY;
                this.pageX = event.pageX;
                this.pageY = event.pageY;
            }

            if (event instanceof MouseEvent)
            {
                this.rightmouse = event.button == 2;
            }

            if (event instanceof KeyboardEvent)
            {
                this.keyCode = event.keyCode;
                this.key = event.key;
            }

            if (event instanceof WheelEvent)
            {
                this.wheelDelta = event.wheelDelta;
            }

            // 赋值上次鼠标事件值
            event.clientX = this.clientX;
            event.clientY = this.clientY;
            event.pageX = this.pageX;
            event.pageY = this.pageY;

            this.dispatchEvent(<any>event);
        }

        /**
         * 清理数据
         */
        private clear()
        {
            this.clientX = 0;
            this.clientY = 0;
            this.rightmouse = false;
            this.key = "";
            this.keyCode = 0;
            this.wheelDelta = 0;
        }
    }

    /**
     * 键盘鼠标输入
     */
    export var windowEventProxy = new EventProxy<WindowEventMap>(window);
}