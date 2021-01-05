namespace feng3d
{

    /**
     * 事件
     */
    export var event: FEvent;

    /**
     * 用于适配不同对象对于的事件
     */
    export interface ObjectEventDispatcher<O, T>
    {
        once<K extends keyof T>(target: O, type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(target: O, type: K, data?: T[K], bubbles?: boolean): Event<T[K]>;
        has<K extends keyof T>(target: O, type: K): boolean;
        on<K extends keyof T>(target: O, type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof T>(target: O, type?: K, listener?: (event: Event<T[K]>) => void, thisObject?: any): void;
    }

    /**
     * 事件
     */
    export class FEvent
    {
        private feventMap = new Map<any, ObjectListener>();

        private getBubbleTargets(target: Object)
        {
            return [target["parent"]];
        }

        /**
         * 监听一次事件后将会被移除
		 * @param type						事件的类型。
		 * @param listener					处理事件的监听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        once(obj: Object, type: string, listener: (event: Event<any>) => void, thisObject = null, priority = 0)
        {
            this.on(obj, type, listener, thisObject, priority, true);
        }

        /**
         * 派发事件
         * 
         * 当事件重复流向一个对象时将不会被处理。
         * 
         * @param e                 事件对象。
         * @returns                 返回事件是否被该对象处理。
         */
        dispatchEvent(obj: Object, e: Event<any>)
        {
            var targets = e.targets = e.targets || [];
            if (targets.indexOf(obj) != -1)
                return false;
            targets.push(obj);

            e.handles = [];

            this.handleEvent(obj, e);

            this.handelEventBubbles(obj, e);

            return true;
        }

        /**
		 * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
		 * @param type                      事件的类型。类型区分大小写。
		 * @param data                      事件携带的自定义数据。
		 * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch(obj: Object, type: string, data?: any, bubbles = false)
        {
            var e: Event<any> = this.makeEvent(type, data, bubbles);
            this.dispatchEvent(obj, e);
            return e;
        }

        /**
		 * 检查 被监听对象 是否为特定事件类型注册了任何监听器. 
         * 
		 * @param obj                       被监听对象。
		 * @param type		                事件的类型。
		 * @return 			                如果指定类型的监听器已注册，则值为 true；否则，值为 false。
         */
        has(obj: Object, type: string): boolean
        {
            var objectListener = this.feventMap.get(obj);
            if (!objectListener) return false;
            return !!(objectListener[type] && objectListener[type].length);
        }

        /**
         * 为监听对象新增指定类型的事件监听。
         * 
         * @param obj                       被监听对象。
		 * @param type						事件的类型。
		 * @param listener					处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority					事件监听器的优先级。数字越大，优先级越高。默认为0。
         * @param once                      值为true时在监听一次事件后该监听器将被移除。默认为false。
         */
        on(obj: Object, type: string, listener: (event: Event<any>) => any, thisObject?: any, priority = 0, once = false)
        {
            if (listener == null) return;

            var objectListener = this.feventMap.get(obj);
            if (!objectListener)
            {
                objectListener = { __anyEventType__: [] }
                this.feventMap.set(obj, objectListener)
            }

            var listeners: ListenerVO[] = objectListener[type] = objectListener[type] || [];
            for (var i = 0; i < listeners.length; i++)
            {
                var element = listeners[i];
                if (element.listener == listener && element.thisObject == thisObject)
                {
                    listeners.splice(i, 1);
                    break;
                }
            }
            for (var i = 0; i < listeners.length; i++)
            {
                var element = listeners[i];
                if (priority > element.priority)
                {
                    break;
                }
            }
            listeners.splice(i, 0, { listener: listener, thisObject: thisObject, priority: priority, once: once });
        }

        /**
         * 移除监听
         * 
         * @param obj                       被监听对象。
		 * @param type						事件的类型。可选。该值为空时所有被监听对象上的监听均将被移除。
		 * @param listener					要删除的监听器对象。可选。该值为空时所有指定类型的监听均将被移除。
         * @param thisObject                监听器的上下文。可选。
         */
        off(obj: Object, type?: string, listener?: (event: Event<any>) => any, thisObject?: any)
        {
            if (!type)
            {
                this.feventMap.delete(obj)
                return;
            }
            var objectListener = this.feventMap.get(obj);
            if (!objectListener) return;

            if (!listener)
            {
                delete objectListener[type];
                return;
            }
            var listeners = objectListener[type];
            if (listeners)
            {
                for (var i = listeners.length - 1; i >= 0; i--)
                {
                    var element = listeners[i];
                    if (element.listener == listener && element.thisObject == thisObject)
                    {
                        listeners.splice(i, 1);
                    }
                }
                if (listeners.length == 0)
                {
                    delete objectListener[type];
                }
            }
        }

        /**
         * 监听对象的任意事件，该对象的任意事件都将触发该监听器的调用。
         * 
         * @param obj                       被监听对象。
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority                  事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        onAny(obj: Object, listener: (event: Event<any>) => void, thisObject?: any, priority = 0)
        {
            var objectListener = this.feventMap.get(obj);
            if (!objectListener)
            {
                objectListener = { __anyEventType__: [] };
                this.feventMap.set(obj, objectListener)
            }

            var listeners: ListenerVO[] = objectListener.__anyEventType__;
            for (var i = 0; i < listeners.length; i++)
            {
                var element = listeners[i];
                if (element.listener == listener && element.thisObject == thisObject)
                {
                    listeners.splice(i, 1);
                    break;
                }
            }
            for (var i = 0; i < listeners.length; i++)
            {
                var element = listeners[i];
                if (priority > element.priority)
                {
                    break;
                }
            }
            listeners.splice(i, 0, { listener: listener, thisObject: thisObject, priority: priority, once: false });
        }

        /**
         * 移除监听对象的任意事件。
         * 
         * @param obj                       被监听对象。
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         */
        offAny(obj: Object, listener?: (event: any) => void, thisObject?: any)
        {
            var objectListener = this.feventMap.get(obj);
            if (!listener)
            {
                if (objectListener)
                    objectListener.__anyEventType__.length = 0;
                return;
            }
            if (objectListener)
            {
                var listeners = objectListener.__anyEventType__;
                for (var i = listeners.length - 1; i >= 0; i--)
                {
                    var element = listeners[i];
                    if (element.listener == listener && element.thisObject == thisObject)
                    {
                        listeners.splice(i, 1);
                    }
                }
            }
        }

        /**
		 * 初始化事件对象
         * 
		 * @param type                      事件的类型。类型区分大小写。
		 * @param data                      事件携带的自定义数据。
		 * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        makeEvent<T>(type: string, data: T, bubbles = false): Event<T>
        {
            return { type: type, data: data, bubbles: bubbles, target: null, currentTarget: null, isStop: false, isStopBubbles: false, targets: [], handles: [] };
        }

        /**
         * 处理事件
         * @param e 事件
         */
        protected handleEvent(obj: Object, e: Event<any>)
        {
            //设置目标
            e.target || (e.target = obj);
            try
            {
                //使用 try 处理 MouseEvent 等无法更改currentTarget的对象
                e.currentTarget = obj;
            } catch (error) { }
            //
            var objectListener = this.feventMap.get(obj);
            if (!objectListener) return;

            var listeners: ListenerVO[] = objectListener[e.type];
            if (listeners)
            {
                //遍历调用事件回调函数
                var listeners0 = listeners.concat();
                for (var i = 0; i < listeners0.length && !e.isStop; i++)
                {
                    listeners0[i].listener.call(listeners0[i].thisObject, e);//此处可能会删除当前事件，所以上面必须拷贝
                    e.handles.push(listeners0[i]);
                }
                for (var i = listeners.length - 1; i >= 0; i--)
                {
                    if (listeners[i].once)
                        listeners.splice(i, 1);
                }
                if (listeners.length == 0)
                    delete objectListener[e.type];
            }
            // Any_EVENT_Type
            listeners = objectListener.__anyEventType__;
            if (listeners)
            {
                //遍历调用事件回调函数
                var listeners0 = listeners.concat();
                for (var i = 0; i < listeners0.length && !e.isStop; i++)
                {
                    listeners0[i].listener.call(listeners0[i].thisObject, e);//此处可能会删除当前事件，所以上面必须拷贝
                }
                for (var i = listeners.length - 1; i >= 0; i--)
                {
                    if (listeners[i].once)
                        listeners.splice(i, 1);
                }
            }
        }

        /**
         * 处理事件冒泡
         * @param e 事件
         */
        protected handelEventBubbles(obj: Object, e: Event<any>)
        {
            if (e.bubbles && !e.isStopBubbles)
            {
                var bubbleTargets = this.getBubbleTargets(obj);
                for (var i = 0, n = bubbleTargets.length; i < n; i++)
                {
                    var bubbleTarget = bubbleTargets[i];
                    if (!e.isStop && bubbleTarget)
                    {
                        if (bubbleTarget.dispatchEvent)
                        {
                            bubbleTarget.dispatchEvent(e);
                        } else
                        {
                            this.dispatchEvent(bubbleTarget, e);
                        }
                    }
                }
            }
        }

    }

    event = new FEvent();

    interface ObjectListener
    {
        [type: string]: ListenerVO[];
        __anyEventType__: ListenerVO[];
    }

	/**
	 * 事件
	 */
    export interface Event<T>
    {
		/**
		 * 事件的类型。类型区分大小写。
		 */
        type: string;

        /**
         * 事件携带的自定义数据
         */
        data: T;

		/**
		 * 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
		 */
        bubbles: boolean

		/**
		 * 事件目标。
		 */
        target: any;

		/**
		 * 当前正在使用某个事件监听器处理 Event 对象的对象。
		 */
        currentTarget: any;

        /**
         * 是否停止处理事件监听器
         */
        isStop: boolean

        /**
         * 是否停止冒泡
         */
        isStopBubbles: boolean

        /**
         * 事件流过的对象列表，事件路径
         */
        targets: any[];

        /**
         * 处理列表
         */
        handles: ListenerVO[];
    }

    /**
     * 监听数据
     */
    interface ListenerVO
    {
        /**
         * 监听函数
         */
        listener: (event: Event<any>) => void;
        /**
         * 监听函数作用域
         */
        thisObject: any;
        /**
         * 优先级
         */
        priority: number;
        /**
         * 是否只监听一次
         */
        once: boolean;
    }
}