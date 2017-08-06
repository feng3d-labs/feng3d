namespace feng3d
{
	/**
	 * 事件
	 */
    export interface EventVO<T>
    {
		/**
		 * 事件的类型。类型区分大小写。
		 */
        type?: string;

        /**
         * 事件携带的自定义数据
         */
        data?: T;

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
            Event.once(this, type, listener, thisObject, priority);
        }

        /**
		 * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
		 * @param type                      事件的类型。类型区分大小写。
		 * @param data                      事件携带的自定义数据。
		 * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch(type: string, data?: any, bubbles?: boolean)
        {
            Event.dispatch(this, type, data, bubbles);
        }

        /**
		 * 检查 Event 对象是否为特定事件类型注册了任何侦听器. 
		 *
		 * @param type		事件的类型。
		 * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        has(type: string): boolean
        {
            return Event.has(this, type);
        }

        /**
         * 添加监听
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on(type: string, listener: (event: any) => any, thisObject?: any, priority?: number, once?: boolean)
        {
            Event.on(this, type, listener, thisObject, priority, once);
        }

        /**
         * 移除监听
         * @param dispatcher 派发器
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         */
        off(type?: string, listener?: (event: any) => any, thisObject?: any)
        {
            Event.off(this, type, listener, thisObject);
        }

        // static attach<T extends IEvent<any>>(target, eventEmiter: T = null): T
        // {
        //     eventEmiter = eventEmiter || <T>{};
        //     eventEmiter.once = (type, listener, thisObject, priority) =>
        //     {
        //         Event.on(target, type, listener, thisObject, priority);
        //     }
        //     eventEmiter.dispatch = (type, data, bubbles) =>
        //     {
        //         Event.dispatch(target, type, data, bubbles);
        //     }
        //     eventEmiter.has = (type) =>
        //     {
        //         return Event.has(target, type);
        //     }
        //     eventEmiter.on = (type, listener, thisObject, priority, once) =>
        //     {
        //         Event.on(target, type, listener, thisObject, priority, once);
        //     }
        //     eventEmiter.off = (type, listener, thisObject) =>
        //     {
        //         Event.off(target, type, listener, thisObject);
        //     }
        //     return eventEmiter;
        // }

        static getBubbleTargets(target)
        {
            return [target["parent"]];
        }

        private static listenermap: ListenerMap = {};

        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        private static once(target: any, type: string, listener: (event: EventVO<any>) => void, thisObject: any, priority = 0): void
        {
            this.on(target, type, listener, thisObject, priority, true);
        }

        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param target                    事件主体
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        private static dispatch(target: any, type: string, data = null, bubbles = false)
        {
            var eventVO: EventVO<any> = { ...data };
            eventVO.type = type;
            eventVO.data = data;
            eventVO.bubbles = bubbles;
            this._dispatch(target, eventVO);
        }

        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param target                    事件主体
         * @param event						调度到事件流中的 Event 对象。
         */
        private static _dispatch(target: any, event: EventVO<any>)
        {
            //设置目标
            event.target || (event.target = target);
            event.currentTarget = target;
            var type = event.type;
            var uuid = target.uuid;
            var listeners: ListenerVO[] = uuid && this.listenermap[uuid] && this.listenermap[uuid][type];
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
                    delete this.listenermap[target.uuid][type];
            }

            //事件冒泡(冒泡阶段)
            if (event.bubbles && !event.isStopBubbles)
            {
                var bubbleTargets = this.getBubbleTargets(target);
                for (var i = 0, n = bubbleTargets.length; i < n; i++)
                {
                    if (!event.isStop)
                        bubbleTargets[i] && Event._dispatch(bubbleTargets[i], event);
                }
            }
        }

        /**
         * 检查 Event 对象是否为特定事件类型注册了任何侦听器. 
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        private static has(target: any, type: string): boolean
        {
            return !!(this.listenermap[target.uuid] && this.listenermap[target.uuid][type] && this.listenermap[target.uuid][type].length);
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
        private static on(target: any, type: string, listener: (event: EventVO<any>) => any, thisObject: any = null, priority = 0, once = false)
        {
            var uuid = target.uuid || (target.uuid = generateUUID());
            var objectListener = this.listenermap[uuid] || (this.listenermap[uuid] = {});
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
        private static off(target: any, type: string = null, listener: (event: EventVO<any>) => any, thisObject: any = null)
        {
            if (!type)
            {
                if (target.uuid)
                    delete this.listenermap[target.uuid];
                return;
            }
            if (!listener)
            {
                if (this.listenermap[target.uuid])
                    delete this.listenermap[target.uuid][type];
                return;
            }
            var listeners = target.uuid && this.listenermap[target.uuid] && this.listenermap[target.uuid][type];
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
                    delete this.listenermap[target.uuid][type];
                }
            }
        }
    }

    interface ListenerMap
    {
        [uuid: string]: ObjectListener;
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

    /**
     * 生成uuid
     */
    var generateUUID = function ()
    {
        // http://www.broofa.com/Tools/Math.uuid.htm
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var uuid = new Array(36);
        var rnd = 0, r;
        return function generateUUID()
        {
            for (var i = 0; i < 36; i++)
            {
                if (i === 8 || i === 13 || i === 18 || i === 23)
                {
                    uuid[i] = '-';
                } else if (i === 14)
                {
                    uuid[i] = '4';
                } else
                {
                    if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                    r = rnd & 0xf;
                    rnd = rnd >> 4;
                    uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
                }
            }
            return uuid.join('');
        };
    }();
}