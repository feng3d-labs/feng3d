namespace feng3d
{
    /**
     * 事件属性名称常量
     */
    export const __event__ = "__event__";

    /**
     * 事件派发器代理的对象
     */
    export const __event_emitter_target__ = "__event_emitter_target__";

    /**
     * 事件冒泡函数名称常量，冒泡的对象需要定义该名称的函数。
     * 
     * function __event_bubble_function__(): any[];
     * 
     * var bubbleObject: { __event_bubble_function__: () => any[] }
     */
    export const __event_bubble_function__ = "__event_bubble_function__";

    /**
     * 事件派发器
     */
    export class EventEmitter<T = any>
    {
        private static targetMap = new Map<any, EventEmitter>();

        /**
         * 获取事件派发器
         * @param target 
         */
        static getEventEmitter(target: any)
        {
            console.assert(target !== undefined && target !== null, `被监听对象无法为undefined或者null！`);
            if (target instanceof EventEmitter)
            {
                return target;
            }
            return this.targetMap.get(target);
        }

        /**
         * 获取事件派发器，当没有找到对应派发器时，返回新建的事件派发器。
         * @param target 
         */
        static getOrCreateEventEmitter(target: any)
        {
            var eventEmitter = this.getEventEmitter(target);
            if (!eventEmitter)
            {
                eventEmitter = new EventEmitter(target);
            }
            return eventEmitter;
        }

        constructor(target?: any)
        {
            if (target === undefined)
            {
                target = this;
            }
            console.assert(!EventEmitter.targetMap.has(target), `同一个 ${target} 对象无法对应两个 EventEmitter！`);
            EventEmitter.targetMap.set(target, this);
            this[__event_emitter_target__] = target;
        }

        /**
         * 返回监听的事件类型列表。
         */
        eventNames<K extends keyof T & string>()
        {
            const names = Object.keys(this[__event__]) as K[];
            return names;
        }

        /**
         * 返回指定事件类型的监听数量。
         * 
         * @param type 事件的类型。
         */
        listenerCount<K extends keyof T & string>(type: K): number
        {
            return this[__event__]?.[type]?.length || 0;
        }

        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once<K extends keyof T & string>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority = 0): this
        {
            this.on(type, listener, thisObject, priority, true);
            return this;
        }

        /**
         * 派发事件
         * 
         * 当事件重复流向一个对象时将不会被处理。
         * 
         * @param e   事件对象
         * @returns 返回事件是否被该对象处理
         */
        emitEvent<K extends keyof T & string>(e: Event<T[K]>)
        {
            // 是否为初次派发
            const isEventStart = !e.target;
            if (isEventStart)
            {
                // 初始化事件
                e.target = e.target || null;
                e.currentTarget = e.currentTarget || null;
                e.isStop = e.isStop || false;
                e.isStopBubbles = e.isStopBubbles || false;
                e.targets = e.targets || [];
                e.handles = e.handles || [];
                e.targetsIndex = e.targetsIndex || 0;
                e.targetsBubblesIndex = e.targetsBubblesIndex || 0;
            }

            var targets = e.targets;
            if (targets.indexOf(this[__event_emitter_target__]) != -1)
                return false;
            targets.push(this[__event_emitter_target__]);

            // 
            let index = e.targetsIndex;
            while (targets.length > index)
            {
                const n = targets.length;
                // 派发事件
                while (e.targetsIndex < n)
                {
                    var eventEmitter = EventEmitter.getOrCreateEventEmitter(targets[e.targetsIndex++]);
                    eventEmitter.handleEvent(e); // 传递到其它对象中去，将会增加 targets 的长度。
                }
                index = e.targetsIndex;
                if (isEventStart)   // 统一在派发事件入口处理冒泡
                {
                    // 处理冒泡
                    if (e.bubbles && !e.isStopBubbles)
                    {
                        while (e.targetsBubblesIndex < n)
                        {
                            var eventEmitter = EventEmitter.getOrCreateEventEmitter(targets[e.targetsBubblesIndex++]);
                            eventEmitter.handelEventBubbles(e); // 冒泡到其它对象中去，将会增加 targets 的长度。
                        }
                        index = e.targetsBubblesIndex;
                    }
                }
            }
            return true;
        }

        /**
         * 将事件调度到事件流中. 事件目标是对其调用 emitEvent() 方法的 Event 对象。
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        emit<K extends keyof T & string>(type: K, data?: T[K], bubbles = false)
        {
            var e: Event<T[K]> = { type: type, data: data, bubbles: bubbles, target: null, currentTarget: null, isStop: false, isStopBubbles: false, targets: [], handles: [] };
            return this.emitEvent(e);
        }

        /**
         * 检查 Event 对象是否为特定事件类型注册了任何侦听器. 
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        has<K extends keyof T & string>(type: K): boolean
        {
            return this.listenerCount(type) > 0;
        }

        /**
         * 为监听对象新增指定类型的事件监听。
         * 
		 * @param type						事件的类型。
		 * @param listener					处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority					事件监听器的优先级。数字越大，优先级越高。默认为0。
         * @param once                      值为true时在监听一次事件后该监听器将被移除。默认为false。
         */
        on<K extends keyof T & string>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority = 0, once = false): this
        {
            if (listener == null) return this;

            var objectListener: ObjectListener = this[__event__];
            if (!objectListener)
            {
                objectListener = { __anyEventType__: [] }
                this[__event__] = objectListener;
            }

            thisObject = thisObject || this;
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
            return this;
        }

        /**
         * 移除监听
         * 
		 * @param type						事件的类型。可选。该值为空时所有被监听对象上的监听均将被移除。
		 * @param listener					要删除的监听器对象。可选。该值为空时所有指定类型的监听均将被移除。
         * @param thisObject                监听器的上下文。可选。
         */
        off<K extends keyof T & string>(type?: K, listener?: (event: Event<T[K]>) => void, thisObject?: any): this
        {
            if (!type)
            {
                this[__event__] = undefined;
                return;
            }

            var objectListener: ObjectListener = this[__event__];
            if (!objectListener) return;

            if (!listener)
            {
                delete objectListener[type];
                return;
            }

            thisObject = thisObject || this;

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
            return this;
        }

        /**
         * 移除所有监听
         * 
		 * @param type						事件的类型。可选。该值为空时所有被监听对象上的监听均将被移除。
         */
        offAll<K extends keyof T & string>(type?: K)
        {
            this.off(type);
            return this;
        }

        /**
         * 监听对象的任意事件，该对象的任意事件都将触发该监听器的调用。
         * 
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority                  事件监听器的优先级。数字越大，优先级越高。默认为0。
         * @param once                      值为true时在监听一次事件后该监听器将被移除。默认为false。
         */
        onAny<K extends keyof T & string>(listener: (event: Event<T[K]>) => void, thisObject?: any, priority = 0, once = false)
        {
            var objectListener: ObjectListener = this[__event__];
            if (!objectListener)
            {
                objectListener = { __anyEventType__: [] };
                this[__event__] = objectListener
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
            listeners.splice(i, 0, { listener: listener, thisObject: thisObject, priority: priority, once: once });
            return this;
        }

        /**
         * 移除监听对象的任意事件。
         * 
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         */
        offAny<K extends keyof T & string>(listener?: (event: Event<T[K]>) => void, thisObject?: any)
        {
            var objectListener: ObjectListener = this[__event__];
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
            return this;
        }

        /**
         * 处理事件
         * @param e 事件
         */
        protected handleEvent<K extends keyof T & string>(e: Event<T[K]>)
        {
            //设置目标
            e.target = e.target || this[__event_emitter_target__];
            e.currentTarget = this[__event_emitter_target__];
            //
            var objectListener: ObjectListener = this[__event__];
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
        protected handelEventBubbles<K extends keyof T & string>(e: Event<T[K]>)
        {
            if (typeof this[__event_emitter_target__]?.[__event_bubble_function__] === "function")
            {
                var bubbleTargets: any[] = this[__event_emitter_target__][__event_bubble_function__]();
                bubbleTargets.forEach(v =>
                {
                    if (v !== undefined && e.targets.indexOf(v) === -1)
                    {
                        e.targets.push(v);
                    }
                });
            }
        }
    }

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
         * 事件目标。
         */
        target?: any;

        /**
         * 当前正在使用某个事件监听器处理 Event 对象的对象。
         */
        currentTarget?: any;

        /**
         * 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        bubbles: boolean;

        /**
         * 是否停止冒泡
         */
        isStopBubbles?: boolean;

        /**
         * 是否停止处理事件监听器
         */
        isStop?: boolean;

        /**
         * 事件流过的对象列表，事件路径
         */
        targets?: any[];

        /**
         * 当前事件流到targets的索引
         */
        targetsIndex?: number;

        /**
         * 当前事件冒泡流到targets的索引
         */
        targetsBubblesIndex?: number;

        /**
         * 处理列表
         */
        handles?: ListenerVO[];
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