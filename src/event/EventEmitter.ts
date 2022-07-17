namespace feng3d
{

    /**
     * 事件发射器
     */
    export class EventEmitter<T = any>
    {
        /**
         * 目标与发射器映射。
         */
        private static targetEmitterMap = new Map<any, EventEmitter>();

        /**
         * 发射器与目标映射。
         */
        private static emitterTargetMap = new Map<EventEmitter, IEventTarget>();

        /**
         * 发射器与监听器映射。
         */
        private static emitterListenerMap = new Map<EventEmitter, ObjectListener>();

        /**
         * 获取事件发射器
         * @param target
         */
        static getEventEmitter(target: any)
        {
            console.assert(target !== undefined && target !== null, `被监听对象无法为undefined或者null！`);
            if (target instanceof EventEmitter)
            {
                return target;
            }

            return this.targetEmitterMap.get(target);
        }

        /**
         * 获取事件发射器，当没有找到对应发射器时，返回新建的事件发射器。
         * @param target
         */
        static getOrCreateEventEmitter(target: any)
        {
            let eventEmitter = this.getEventEmitter(target);

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
            console.assert(!EventEmitter.targetEmitterMap.has(target), `同一个 ${target} 对象无法对应两个 EventEmitter！`);
            EventEmitter.targetEmitterMap.set(target, this);
            EventEmitter.emitterTargetMap.set(this, target);
        }

        /**
         * 返回监听的事件类型列表。
         */
        eventNames<K extends keyof T & string>()
        {
            const names = Object.keys(EventEmitter.emitterListenerMap.get(this)) as K[];

            return names;
        }

        /**
         * 返回指定事件类型的监听数量。
         *
         * @param type 事件的类型。
         */
        listenerCount<K extends keyof T & string>(type: K): number
        {
            return EventEmitter.emitterListenerMap.get(this)?.[type]?.length || 0;
        }

        /**
         * 监听一次事件后将会被移除
         *
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once<K extends keyof T & string>(type: K, listener: (event: IEvent<T[K]>) => void, thisObject?: any, priority = 0): this
        {
            this.on(type, listener, thisObject, priority, true);

            return this;
        }

        /**
         * 发射事件。
         *
         * 当事件重复流向一个对象时将不会被处理。
         *
         * @param event   事件对象
         * @returns 返回事件是否被处理
         */
        emitEvent<K extends keyof T & string>(event: IEvent<T[K]>)
        {
            const currentTarget = EventEmitter.emitterTargetMap.get(this);

            if (event.targets.indexOf(currentTarget) !== -1)
            {
                return event;
            }

            // 处理事件
            const eventEmitter = EventEmitter.getOrCreateEventEmitter(currentTarget);
            eventEmitter.handleEvent(event);

            // 向平级分享事件
            eventEmitter.handelEventShare(event);

            // 向上级报告事件
            eventEmitter.handelEventBubbles(event);

            // 向下级广播事件
            eventEmitter.handelEventBroadcast(event);

            return event; // 当处理次数大于0时表示已被处理。
        }

        /**
         * 发射事件。
         *
         * @param type 事件的类型。类型区分大小写。
         * @param data 事件携带的自定义数据。
         * @param bubbles 是否向上级报告事件。默认为`false`。
         * @param broadcast 是否向下级广播事件。默认为`false`。
         * @param share 是否向平级分享事件。默认为`true`。
         *
         * @returns 返回发射后的事件。
         */
        emit<K extends keyof T & string>(type: K, data?: T[K], bubbles = false, broadcast = false, share = true)
        {
            const event: IEvent<T[K]> = {
                type,
                data,
                share,
                bubbles,
                broadcast,
                target: undefined,
                currentTarget: undefined,
                isStopShare: false,
                isStopBubbles: false,
                isStopBroadcast: false,
                isStopTransmit: false,
                isStop: false,
                targets: [],
                handles: [],
            };
            this.emitEvent(event);

            return event;
        }

        /**
         * 将事件广播到下级对象中。
         *
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         *
         * @returns 返回广播后的事件。
         */
        broadcast<K extends keyof T & string>(type: K, data?: T[K])
        {
            return this.emit(type, data, false, true);
        }

        /**
         * 将事件冒泡到上级对象中。
         *
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         *
         * @returns 返回冒泡后的事件。
         */
        bubbles<K extends keyof T & string>(type: K, data?: T[K])
        {
            return this.emit(type, data, true, false);
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
        on<K extends keyof T & string>(type: K, listener: (event: IEvent<T[K]>) => void, thisObject?: any, priority = 0, once = false): this
        {
            if (listener === null) return this;

            let objectListener = EventEmitter.emitterListenerMap.get(this);

            if (!objectListener)
            {
                objectListener = { __anyEventType__: [] };
                EventEmitter.emitterListenerMap.set(this, objectListener);
            }

            thisObject = thisObject || this;
            const listeners: IEventListener[] = objectListener[type] = objectListener[type] || [];

            let i = 0;

            for (i = 0; i < listeners.length; i++)
            {
                const element = listeners[i];

                if (element.listener === listener && element.thisObject === thisObject)
                {
                    listeners.splice(i, 1);
                    break;
                }
            }
            listeners.push({ listener, thisObject, priority, once });

            return this;
        }

        /**
         * 移除监听
         *
         * @param type						事件的类型。可选。该值为空时所有被监听对象上的监听均将被移除。
         * @param listener					要删除的监听器对象。可选。该值为空时所有指定类型的监听均将被移除。
         * @param thisObject                监听器的上下文。可选。
         */
        off<K extends keyof T & string>(type?: K, listener?: (event: IEvent<T[K]>) => void, thisObject?: any): this
        {
            if (!type)
            {
                EventEmitter.emitterListenerMap.delete(this);

                return this;
            }

            const objectListener = EventEmitter.emitterListenerMap.get(this);

            if (!objectListener) return this;

            if (!listener)
            {
                delete objectListener[type];

                return this;
            }

            thisObject = thisObject || this;

            const listeners = objectListener[type];

            if (listeners)
            {
                for (let i = listeners.length - 1; i >= 0; i--)
                {
                    const element = listeners[i];

                    if (element.listener === listener && element.thisObject === thisObject)
                    {
                        listeners.splice(i, 1);
                        break;
                    }
                }
                if (listeners.length === 0)
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
        onAny<K extends keyof T & string>(listener: (event: IEvent<T[K]>) => void, thisObject?: any, priority = 0, once = false)
        {
            let objectListener = EventEmitter.emitterListenerMap.get(this);

            if (!objectListener)
            {
                objectListener = { __anyEventType__: [] };
                EventEmitter.emitterListenerMap.set(this, objectListener);
            }

            const listeners = objectListener.__anyEventType__;

            let i = 0;

            for (i = 0; i < listeners.length; i++)
            {
                const element = listeners[i];

                if (element.listener === listener && element.thisObject === thisObject)
                {
                    listeners.splice(i, 1);
                    break;
                }
            }
            listeners.push({ listener, thisObject, priority, once });

            return this;
        }

        /**
         * 移除监听对象的任意事件。
         *
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         */
        offAny<K extends keyof T & string>(listener?: (event: IEvent<T[K]>) => void, thisObject?: any)
        {
            const objectListener = EventEmitter.emitterListenerMap.get(this);

            if (!listener)
            {
                if (objectListener)
                {
                    objectListener.__anyEventType__.length = 0;
                }

                return;
            }
            if (objectListener)
            {
                const listeners = objectListener.__anyEventType__;

                for (let i = listeners.length - 1; i >= 0; i--)
                {
                    const element = listeners[i];

                    if (element.listener === listener && element.thisObject === thisObject)
                    {
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }

            return this;
        }

        /**
         * 处理事件
         * @param e 事件
         */
        protected handleEvent<K extends keyof T & string>(e: IEvent<T[K]>)
        {
            // 设置目标
            const eventTarget = EventEmitter.emitterTargetMap.get(this);
            e.target = e.target || eventTarget;
            e.currentTarget = eventTarget;
            e.targets.push(eventTarget);
            //
            const objectListener = EventEmitter.emitterListenerMap.get(this);

            if (!objectListener) return;

            let listeners = objectListener[e.type];

            const callListeners: IEventListener[] = [];
            if (listeners)
            {
                // 遍历调用事件回调函数
                listeners.forEach((v) => callListeners.push(v));

                for (let i = listeners.length - 1; i >= 0; i--)
                {
                    if (listeners[i].once)
                    {
                        listeners.splice(i, 1);
                    }
                }
                if (listeners.length === 0)
                {
                    delete objectListener[e.type];
                }
            }
            // Any_EVENT_Type
            listeners = objectListener.__anyEventType__;
            if (listeners)
            {
                // 遍历调用事件回调函数
                listeners.forEach((v) => callListeners.push(v));

                for (let i = listeners.length - 1; i >= 0; i--)
                {
                    if (listeners[i].once)
                    {
                        listeners.splice(i, 1);
                    }
                }
            }

            // 按优先级从高到底排序进行执行监听器。
            callListeners.sort((a, b) => b.priority - a.priority);
            for (let i = 0; i < callListeners.length && !e.isStop; i++)
            {
                callListeners[i].listener.call(callListeners[i].thisObject, e);
                e.handles.push(callListeners[i]);
            }
        }

        /**
         * 向平级分享事件
         *
         * @param event 事件
         */
        protected handelEventShare<K extends keyof T & string>(event: IEvent<T[K]>)
        {
            if (!event.share || event.isStopShare || event.isStop || event.isStopTransmit) return;

            const eventTarget = EventEmitter.emitterTargetMap.get(this);
            if (typeof eventTarget?.getShareTargets === 'function')
            {
                const bubbleTargets = eventTarget.getShareTargets();
                bubbleTargets?.forEach((v) =>
                {
                    if (v === undefined || event.targets.indexOf(v) !== -1) return;

                    // 处理事件
                    const eventEmitter = EventEmitter.getOrCreateEventEmitter(v);
                    eventEmitter.handleEvent(event);
                    // 继续分享事件
                    eventEmitter.handelEventShare(event);
                });
            }
        }

        /**
         * 向上级报告事件
         *
         * @param event 事件
         */
        protected handelEventBubbles<K extends keyof T & string>(event: IEvent<T[K]>)
        {
            if (!event.bubbles || event.isStopBubbles || event.isStop || event.isStopTransmit) return;

            const eventTarget = EventEmitter.emitterTargetMap.get(this);
            if (typeof eventTarget?.getBubbleTargets === 'function')
            {
                const bubbleTargets = eventTarget.getBubbleTargets();
                bubbleTargets?.forEach((v) =>
                {
                    if (v === undefined || event.targets.indexOf(v) !== -1) return;

                    // 处理事件
                    const eventEmitter = EventEmitter.getOrCreateEventEmitter(v);
                    eventEmitter.handleEvent(event);
                    // 向平级分享事件
                    eventEmitter.handelEventShare(event);
                    // 向上级报告事件
                    eventEmitter.handelEventBubbles(event);
                });
            }
        }

        /**
         * 向下级广播事件
         * 
         * @param event 事件
         */
        protected handelEventBroadcast<K extends keyof T & string>(event: IEvent<T[K]>)
        {
            if (!event.broadcast || event.isStopBroadcast || event.isStop || event.isStopTransmit) return;

            const eventTarget = EventEmitter.emitterTargetMap.get(this);
            if (typeof eventTarget?.getBroadcastTargets === 'function')
            {
                const broadcastTargets = eventTarget.getBroadcastTargets();
                broadcastTargets?.forEach((v) =>
                {
                    if (v === undefined || event.targets.indexOf(v) !== -1) return;

                    // 处理事件
                    const eventEmitter = EventEmitter.getOrCreateEventEmitter(v);
                    eventEmitter.handleEvent(event);
                    // 向平级分享事件
                    eventEmitter.handelEventShare(event);
                    // 继续向下级广播事件
                    eventEmitter.handelEventBroadcast(event);
                });
            }
        }
    }

    interface ObjectListener
    {
        [type: string]: IEventListener[];
        __anyEventType__: IEventListener[];
    }
}