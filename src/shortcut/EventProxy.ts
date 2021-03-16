namespace feng3d
{
    /**
     * 代理 EventTarget, 处理js事件中this关键字问题
     */
    export class EventProxy<T = any> extends EventEmitter<T>
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

        deltaY: number = 0;

        private listentypes: (keyof T)[] = [];

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
                    this._target.removeEventListener(<any>element, this.onMouseKey);
                });
            }
            this._target = v;
            if (this._target)
            {
                this.listentypes.forEach(element =>
                {
                    this._target.addEventListener(<any>element, this.onMouseKey);
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
        once<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number)
        {
            this.on(<any>type, listener, thisObject, priority, true);
            return this;
        }

        /**
         * 添加监听
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on<K extends keyof T & string>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority = 0, once = false): this
        {
            super.on(type, listener, thisObject, priority, once);
            if (this.listentypes.indexOf(type) == -1)
            {
                this.listentypes.push(type);
                this._target.addEventListener(<any>type, this.onMouseKey);
            }
            return this;
        }

        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         */
        off<K extends keyof T & string>(type?: K, listener?: (event: Event<T[K]>) => void, thisObject?: any): this
        {
            super.off(type, listener, thisObject);
            if (!type)
            {
                this.listentypes.forEach(element =>
                {
                    this._target.removeEventListener(<any>element, this.onMouseKey);
                });
                this.listentypes.length = 0;
            } else if (!this.has(type))
            {
                this._target.removeEventListener(<any>type, this.onMouseKey);
                this.listentypes.splice(this.listentypes.indexOf(type), 1);
            }
            return this;
        }

        /**
         * 处理鼠标按下时同时出发 "mousemove" 事件bug
         */
        private handleMouseMoveBug = true;
        private mousedownposition: { x: number, y: number };
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

                // 处理鼠标按下时同时出发 "mousemove" 事件bug
                if (this.handleMouseMoveBug)
                {
                    if (event.type == "mousedown")
                    {
                        this.mousedownposition = { x: event.clientX, y: event.clientY };
                    }
                    if (event.type == "mousemove")
                    {
                        if (this.mousedownposition)
                        {
                            if (this.mousedownposition.x == event.clientX && this.mousedownposition.y == event.clientY)
                            {
                                // console.log(`由于系统原因，触发mousedown同时触发了mousemove，此处屏蔽mousemove事件派发！`);
                                return;
                            }
                        }
                    }
                    if (event.type == "mouseup")
                    {
                        this.mousedownposition = null;
                    }
                }
            }

            if (event instanceof KeyboardEvent)
            {
                this.keyCode = event.keyCode;
                this.key = event.key;
            }

            if (event instanceof WheelEvent)
            {
                this.deltaY = event.deltaY;
            }

            // 赋值上次鼠标事件值
            // event.clientX = this.clientX;
            // event.clientY = this.clientY;
            // event.pageX = this.pageX;
            // event.pageY = this.pageY;

            this.emit(event.type, event);
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
            this.deltaY = 0;
        }
    }
}