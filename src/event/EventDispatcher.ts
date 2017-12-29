namespace feng3d
{
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
        bubbles?: boolean

		/**
		 * 事件目标。
		 */
        target?: any;

		/**
		 * 当前正在使用某个事件侦听器处理 Event 对象的对象。
		 */
        currentTarget?: any;

        /**
         * 是否停止处理事件监听器
         */
        isStop?: boolean

        /**
         * 是否停止冒泡
         */
        isStopBubbles?: boolean
    }

    export interface IEventDispatcher<T>
    {
        once<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(type: K, data?: T[K], bubbles?: boolean);
        has<K extends keyof T>(type: K): boolean;
        on<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof T>(type?: K, listener?: (event: Event<T[K]>) => any, thisObject?: any);
    }

    export const EVENT_KEY = "__event__";

    function getBubbleTargets(target)
    {
        return [target["parent"]];
    }

	/**
	 * 事件适配器
	 */
    export class EventDispatcher
    {
        /**
         * 监听一次事件后将会被移除
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once(type: string, listener: (event: any) => void, thisObject = null, priority = 0)
        {
            this.on(type, listener, thisObject, priority, true);
        }

        /**
         * 派发事件
         * @param event   事件对象
         */
        dispatchEvent(event: Event<any>)
        {
            //设置目标
            event.target || (event.target = this);
            try
            {
                //使用 try 处理 MouseEvent 等无法更改currentTarget的对象
                event.currentTarget = this;
            } catch (error) { }
            var listeners: ListenerVO[] = this[EVENT_KEY] && this[EVENT_KEY][event.type];
            if (listeners)
            {
                //遍历调用事件回调函数
                for (var i = 0; i < listeners.length && !event.isStop; i++)
                {
                    listeners[i].listener.call(listeners[i].thisObject, event);
                }
                for (var i = listeners.length - 1; i >= 0; i--)
                {
                    if (listeners[i].once)
                        listeners.splice(i, 1);
                }
                if (listeners.length == 0)
                    delete this[EVENT_KEY][event.type];
            }

            //事件冒泡(冒泡阶段)
            if (event.bubbles && !event.isStopBubbles)
            {
                var bubbleTargets = getBubbleTargets(this);
                for (var i = 0, n = bubbleTargets.length; i < n; i++)
                {
                    var bubbleTarget = bubbleTargets[i];
                    if (!event.isStop && bubbleTarget instanceof EventDispatcher)
                        bubbleTarget.dispatchEvent(event);
                }
            }
        }

        /**
		 * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
		 * @param type                      事件的类型。类型区分大小写。
		 * @param data                      事件携带的自定义数据。
		 * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch(type: string, data?: any, bubbles = false)
        {
            var event: Event<any> = { type: type, data: data, bubbles: bubbles };
            this.dispatchEvent(event);
        }

        /**
		 * 检查 Event 对象是否为特定事件类型注册了任何侦听器. 
		 *
		 * @param type		事件的类型。
		 * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        has(type: string): boolean
        {
            return !!(this[EVENT_KEY] && this[EVENT_KEY][type] && this[EVENT_KEY][type].length);
        }

        /**
         * 添加监听
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on(type: string, listener: (event: any) => any, thisObject?: any, priority = 0, once = false)
        {
            var objectListener = this[EVENT_KEY] || (this[EVENT_KEY] = {});
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
         * @param dispatcher 派发器
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         */
        off(type?: string, listener?: (event: any) => any, thisObject?: any)
        {
            if (!type)
            {
                delete this[EVENT_KEY];
                return;
            }
            if (!listener)
            {
                if (this[EVENT_KEY])
                    delete this[EVENT_KEY][type];
                return;
            }
            var listeners = this[EVENT_KEY] && this[EVENT_KEY][type];
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
                    delete this[EVENT_KEY][type];
                }
            }
        }
    }

    interface ObjectListener
    {
        [type: string]: ListenerVO[];
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