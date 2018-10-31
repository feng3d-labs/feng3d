namespace feng3d
{
    export var fevent: FEvent;

    var feventMap = new Map<any, ObjectListener>();

    function getBubbleTargets(target)
    {
        return [target["parent"]];
    }

    export class FEvent
    {
        /**
         * 监听一次事件后将会被移除
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once(obj: Object, type: string, listener: (event: any) => void, thisObject = null, priority = 0)
        {
            this.on(obj, type, listener, thisObject, priority, true);
        }

        /**
         * 派发事件
         * 
         * 当事件重复流向一个对象时将不会被处理。
         * 
         * @param e   事件对象
         * @returns 返回事件是否被该对象处理
         */
        dispatchEvent(obj: Object, e: Event<any>)
        {
            var targets = e.targets = e.targets || [];
            if (targets.indexOf(obj) != -1)
                return false;
            targets.push(obj);

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
            var e: Event<any> = { type: type, data: data, bubbles: bubbles, target: null, currentTarget: null, isStop: false, isStopBubbles: false, targets: [] };
            this.dispatchEvent(obj, e);
            return e;
        }

        /**
		 * 检查 Event 对象是否为特定事件类型注册了任何侦听器. 
		 *
		 * @param type		事件的类型。
		 * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        has(obj: Object, type: string): boolean
        {
            return !!(feventMap.get(obj) && feventMap.get(obj)[type] && feventMap.get(obj)[type].length);
        }

        /**
         * 添加监听
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on(obj: Object, type: string, listener: (event: any) => any, thisObject?: any, priority = 0, once = false)
        {
            var objectListener = feventMap.get(obj);
            if (!objectListener) (feventMap.set(obj, objectListener = {}));

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
        off(obj: Object, type?: string, listener?: (event: any) => any, thisObject?: any)
        {
            if (!type)
            {
                feventMap.delete(obj)
                return;
            }
            if (!listener)
            {
                if (feventMap.get(obj))
                    delete feventMap.get(obj)[type];
                return;
            }
            var listeners = feventMap.get(obj) && feventMap.get(obj)[type];
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
                    delete feventMap.get(obj)[type];
                }
            }
        }

        /**
         * 监听对象的所有事件
         * @param obj 被监听对象
         * @param listener 回调函数
         * @param thisObject 回调函数 this 指针
         * @param priority 优先级
         */
        onAll(obj: Object, listener: (event: any) => any, thisObject?: any, priority = 0)
        {
            var objectListener = feventMap.get(obj)
            if (!objectListener) (feventMap.set(obj, objectListener = {}));

            var listeners: ListenerVO[] = objectListener.__allEventType__ = objectListener.__allEventType__ || [];
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
         * 移除监听对象的所有事件
         * @param obj 被监听对象
         * @param listener 回调函数
         * @param thisObject 回调函数 this 指针
         */
        offAll(obj: Object, listener?: (event: any) => any, thisObject?: any)
        {
            if (!listener)
            {
                if (feventMap.get(obj))
                    delete feventMap.get(obj).__allEventType__;
                return;
            }
            var listeners = feventMap.get(obj) && feventMap.get(obj).__allEventType__;
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
                    delete feventMap.get(obj).__allEventType__;
                }
            }
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
            var listeners: ListenerVO[] = feventMap.get(obj) && feventMap.get(obj)[e.type];
            if (listeners)
            {
                //遍历调用事件回调函数
                for (var i = 0; i < listeners.length && !e.isStop; i++)
                {
                    listeners[i].listener.call(listeners[i].thisObject, e);
                }
                for (var i = listeners.length - 1; i >= 0; i--)
                {
                    if (listeners[i].once)
                        listeners.splice(i, 1);
                }
                if (listeners.length == 0)
                    delete feventMap.get(obj)[e.type];
            }
            // All_EVENT_Type
            listeners = feventMap.get(obj) && feventMap.get(obj).__allEventType__;
            if (listeners)
            {
                //遍历调用事件回调函数
                for (var i = 0; i < listeners.length && !e.isStop; i++)
                {
                    listeners[i].listener.call(listeners[i].thisObject, e);
                }
                for (var i = listeners.length - 1; i >= 0; i--)
                {
                    if (listeners[i].once)
                        listeners.splice(i, 1);
                }
                if (listeners.length == 0)
                    delete feventMap.get(obj).__allEventType__;
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
                var bubbleTargets = getBubbleTargets(obj);
                for (var i = 0, n = bubbleTargets.length; i < n; i++)
                {
                    var bubbleTarget = bubbleTargets[i];
                    if (!e.isStop && bubbleTarget instanceof EventDispatcher)
                        bubbleTarget.dispatchEvent(e);
                }
            }
        }

    }

    fevent = new FEvent();

    interface ObjectListener
    {
        [type: string]: ListenerVO[];
        __allEventType__?: ListenerVO[];
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