namespace feng3d
{

    export interface IEventEmitter<T>
    {
        once<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number): this;
        emit<K extends keyof T>(type: K, data?: T[K], bubbles?: boolean): Event<T[K]>;
        has<K extends keyof T>(type: K): boolean;
        on<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number, once?: boolean): this;
        off<K extends keyof T>(type?: K, listener?: (event: Event<T[K]>) => void, thisObject?: any): this;
    }

	/**
	 * 事件适配器
	 */
    export class EventEmitter
    {
        /**
         * Return an array listing the events for which the emitter has registered
         * listeners.
         */
        eventNames()
        {
            event.eventNames(this);
        }

        // /**
        //  * Return the listeners registered for a given event.
        //  */
        // listeners(type: string)
        // {
        //     return event.listeners(this, type);
        // }

        /**
         * Return the number of listeners listening to a given event.
         */
        listenerCount(type: string)
        {
            return event.listenerCount(this, type);
        }

        /**
         * 监听一次事件后将会被移除
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once(type: string, listener: (event: Event<any>) => void, thisObject = null, priority = 0)
        {
            event.on(this, type, listener, thisObject, priority, true);
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
        emitEvent(e: Event<any>)
        {
            return event.dispatchEvent(this, e);
        }

        /**
		 * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
		 * @param type                      事件的类型。类型区分大小写。
		 * @param data                      事件携带的自定义数据。
		 * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        emit(type: string, data?: any, bubbles = false)
        {
            return event.emit(this, type, data, bubbles);
        }

        /**
		 * 检查 Event 对象是否为特定事件类型注册了任何侦听器. 
		 *
		 * @param type		事件的类型。
		 * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        has(type: string): boolean
        {
            return event.has(this, type);
        }

        /**
         * 添加监听
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on(type: string, listener: (event: Event<any>) => void, thisObject?: any, priority = 0, once = false)
        {
            event.on(this, type, listener, thisObject, priority, once);
            return this;
        }

        /**
         * 移除监听
         * @param dispatcher 派发器
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         */
        off(type?: string, listener?: (event: Event<any>) => void, thisObject?: any)
        {
            event.off(this, type, listener, thisObject);
            return this;
        }

        /**
         * Remove all listeners, or those of the specified event.
         */
        offAll(type?: string)
        {
            event.offAll(this, type);
            return this;
        }

        /**
         * 监听对象的任意事件，该对象的任意事件都将触发该监听器的调用。
         * 
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority                  事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        onAny(listener: (event: Event<any>) => void, thisObject?: any, priority = 0)
        {
            event.onAny(this, listener, thisObject, priority);
            return this;
        }

        /**
         * 移除监听对象的任意事件。
         * 
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         */
        offAny(listener?: (event: Event<any>) => void, thisObject?: any)
        {
            event.offAny(this, listener, thisObject);
            return this;
        }

        /**
         * 处理事件
         * @param e 事件
         */
        protected handleEvent(e: Event<any>)
        {
            event["handleEvent"](this, e);
        }

        /**
         * 处理事件冒泡
         * @param e 事件
         */
        protected handelEventBubbles(e: Event<any>)
        {
            event["handelEventBubbles"](this, e);
        }
    }
}