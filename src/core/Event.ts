module feng3d
{
	/**
	 * 事件
	 */
    export interface EventVO<T>
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

    export interface IEvent<T>
    {
        once<K extends keyof T>(type: K, listener: (event: T[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(type: K, data?: T[K], bubbles?: boolean);
        has<K extends keyof T>(type: K): boolean;
        on<K extends keyof T>(type: K, listener: (event: T[K]) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof T>(type?: K, listener?: (event: T[K]) => any, thisObject?: any);
    }

    export var event = {
        on: on,
        once: once,
        off: off,
        dispatch: dispatch,
        has: has,
    };

    export const EVENT_KEY = "__event__";

    /**
     * 监听一次事件后将会被移除
     * @param type						事件的类型。
     * @param listener					处理事件的侦听器函数。
     * @param thisObject                listener函数作用域
     * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
     */
    function once(target: any, type: string, listener: (event: EventVO<any>) => void, thisObject: any, priority = 0): void
    {
        on(target, type, listener, thisObject, priority, true);
    }

    /**
     * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
     * @param target                    事件主体
     * @param type                      事件的类型。类型区分大小写。
     * @param data                      事件携带的自定义数据。
     * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
     */
    function dispatch(target: any, type: string, data = null, bubbles = false)
    {
        var eventVO: EventVO<any> = <any>{ ...data };
        eventVO.type = type;
        eventVO.data = data;
        eventVO.bubbles = bubbles;
        _dispatch(target, eventVO);
    }

    /**
     * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
     * @param target                    事件主体
     * @param event						调度到事件流中的 Event 对象。
     */
    function _dispatch(target: any, event: EventVO<any>)
    {
        //设置目标
        event.target || (event.target = target);
        event.currentTarget = target;
        var type = event.type;
        var listeners: ListenerVO[] = target[EVENT_KEY] && target[EVENT_KEY][type];
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
                delete target[EVENT_KEY][type];
        }

        //事件冒泡(冒泡阶段)
        if (event.bubbles && !event.isStopBubbles)
        {
            var bubbleTargets = getBubbleTargets(target);
            for (var i = 0, n = bubbleTargets.length; i < n; i++)
            {
                if (!event.isStop)
                    bubbleTargets[i] && _dispatch(bubbleTargets[i], event);
            }
        }
    }

    /**
     * 检查 Event 对象是否为特定事件类型注册了任何侦听器. 
     *
     * @param type		事件的类型。
     * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
     */
    function has(target: any, type: string): boolean
    {
        return !!(target[EVENT_KEY] && target[EVENT_KEY][type] && target[EVENT_KEY][type].length);
    }

    /**
     * 添加监听
     * @param dispatcher 派发器
     * @param target                    事件主体
     * @param type						事件的类型。
     * @param listener					处理事件的侦听器函数。
     * @param thisObject                listener函数作用域
     * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
     */
    function on(target: any, type: string, listener: (event: EventVO<any>) => any, thisObject: any = null, priority = 0, once = false)
    {
        var objectListener = target[EVENT_KEY] || (target[EVENT_KEY] = {});
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
     * @param target                    事件主体
     * @param type						事件的类型。
     * @param listener					要删除的侦听器对象。
     * @param thisObject                listener函数作用域
     */
    function off(target: any, type?: string, listener?: (event: EventVO<any>) => any, thisObject: any = null)
    {
        if (!type)
        {
            delete target[EVENT_KEY];
            return;
        }
        if (!listener)
        {
            if (target[EVENT_KEY])
                delete target[EVENT_KEY][type];
            return;
        }
        var listeners = target[EVENT_KEY] && target[EVENT_KEY][type];
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
                delete target[EVENT_KEY][type];
            }
        }
    }

    function getBubbleTargets(target)
    {
        return [target["parent"]];
    }

    // function attach<T>(target: T): T & Event
    // {
    //     var event = <T & Event>target;
    //     event.once = (type, listener, thisObject, priority) =>
    //     {
    //         on(this, type, listener, thisObject, priority);
    //     }
    //     event.dispatch = (type, data, bubbles) =>
    //     {
    //         dispatch(this, type, data, bubbles);
    //     }
    //     event.has = (type) =>
    //     {
    //         return has(this, type);
    //     }
    //     event.on = (type, listener, thisObject, priority, once) =>
    //     {
    //         on(this, type, listener, thisObject, priority, once);
    //     }
    //     event.off = (type, listener, thisObject) =>
    //     {
    //         off(this, type, listener, thisObject);
    //     }
    //     return event;
    // }

	/**
	 * 事件适配器
	 */
    export class Event
    {
        /**
         * 监听一次事件后将会被移除
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once(type: string, listener: (event: any) => void, thisObject?: any, priority?: number)
        {
            once(this, type, listener, thisObject, priority);
        }

        /**
		 * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
		 * @param type                      事件的类型。类型区分大小写。
		 * @param data                      事件携带的自定义数据。
		 * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch(type: string, data?: any, bubbles?: boolean)
        {
            dispatch(this, type, data, bubbles);
        }

        /**
		 * 检查 Event 对象是否为特定事件类型注册了任何侦听器. 
		 *
		 * @param type		事件的类型。
		 * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        has(type: string): boolean
        {
            return has(this, type);
        }

        /**
         * 添加监听
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on(type: string, listener: (event: any) => any, thisObject?: any, priority?: number, once?: boolean)
        {
            on(this, type, listener, thisObject, priority, once);
        }

        /**
         * 移除监听
         * @param dispatcher 派发器
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         */
        off(type?: string, listener?: (event: any) => any, thisObject?: any)
        {
            off(this, type, listener, thisObject);
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
        listener: (event: EventVO<any>) => void;
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