module feng3d
{

	/**
	 * 为了实现非flash原生显示列表的冒泡事件，自定义事件适配器
	 * @author feng 2016-3-22
	 */
    export class EventDispatcher implements IEventDispatcher
    {
        private _listenermap: { [type: string]: ListenerVO[] } = {};

        /**
         * 名称
         */
        public name: string;

        /** 
         * 冒泡属性名称为“parent” 
         */
        protected _bubbleAttribute: string = "parent";

        /**
         * 事件适配主体
         */
        private _target: IEventDispatcher;

        /**
         * 延迟计数，当计数大于0时事件将会被收集，等到计数等于0时派发
         */
        private _delaycount = 0;

        /**
         * 被延迟的事件列表
         */
        private _delayEvents: Event[] = [];

		/**
		 * 构建事件适配器
		 * @param target		事件适配主体
		 */
        constructor(target: IEventDispatcher = null)
        {
            this._target = target;
            if (this._target == null)
                this._target = this;
        }

        /**
         * 监听一次事件后将会被移除
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        public once(type: string, listener: (event: Event) => void, thisObject: any, priority: number = 0): void
        {
            if (listener == null)
                return;

            this._addEventListener(type, listener, thisObject, priority, true);
        }

        /**
         * 使用 EventDispatcher 对象注册事件侦听器对象，以使侦听器能够接收事件通知。
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        public addEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority: number = 0): void
        {
            if (listener == null)
                return;

            this._addEventListener(type, listener, thisObject, priority);
        }

        /**
		 * 从 EventDispatcher 对象中删除侦听器. 如果没有向 IEventDispatcher 对象注册任何匹配的侦听器，则对此方法的调用没有任何效果。
		 *
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        public removeEventListener(type: string, listener: (event: Event) => void, thisObject: any): void
        {
            this._removeEventListener(type, listener, thisObject);
        }

        /**
		 * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEventDispatcher 对象。
		 * @param event						调度到事件流中的 Event 对象。
         * @returns                         被延迟返回false，否则返回true
         */
        public dispatchEvent(event: Event): boolean
        {
            if (this._delaycount > 0)
            {
                if (this._delayEvents.indexOf(event) == -1)
                    this._delayEvents.push(event);
                return false;
            }

            //设置目标
            event.target = this._target;
            var listeners: ListenerVO[] = this._listenermap[event.type];

            if (listeners && listeners.length > 0)
            {
                var onceElements: number[] = [];
                //遍历调用事件回调函数
                for (var i = 0; i < listeners.length && !event.isStop; i++)
                {
                    var element = listeners[i];
                    element.listener.call(element.thisObject, event);
                    if (element.once)
                    {
                        onceElements.push(i);
                    }
                }

                while (onceElements.length > 0)
                {
                    listeners.splice(onceElements.pop(), 1);
                }
            }

            //事件冒泡(冒泡阶段)
            if (event.bubbles && !event.isStopBubbles)
            {
                this.dispatchBubbleEvent(event);
            }
            return true;
        }

        /**
         * 锁住事件
         * 当派发事件时先收集下来，调用unlockEvent派发被延迟的事件
         * 每调用一次lockEvent计数加1、调用unlockEvent一次计数减1，当计数为0时派发所有被收集事件
         * 与unlockEvent配合使用
         */
        public lockEvent()
        {
            this._delaycount = this._delaycount + 1;
        }

        /**
         * 解锁事件，派发被锁住的事件
         * 每调用一次lockEvent计数加1、调用unlockEvent一次计数减1，当计数为0时派发所有被收集事件
         * 与delay配合使用
         */
        public unlockEvent()
        {
            this._delaycount = this._delaycount - 1;
            if (this._delaycount == 0)
            {
                for (var i = 0; i < this._delayEvents.length; i++)
                {
                    this.dispatchEvent(this._delayEvents[i]);
                }
                this._delayEvents.length = 0;
            }
        }

        /**
         * 事件是否被锁住
         */
        public get isLockEvent()
        {
            return this._delaycount > 0;
        }

        /**
		 * 检查 EventDispatcher 对象是否为特定事件类型注册了任何侦听器. 
		 *
		 * @param type		事件的类型。
		 * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        public hasEventListener(type: string): boolean
        {
            return !!(this._listenermap[type] && this._listenermap[type].length);
        }

        /**
         * 派发冒泡事件
         * @param event						调度到事件流中的 Event 对象。
         */
        private dispatchBubbleEvent(event: Event): void
        {
            var bubbleTargets = this.getBubbleTargets(event);
            bubbleTargets && bubbleTargets.forEach(element =>
            {
                element && element.dispatchEvent(event);
            });
        }

        /**
         * 获取冒泡对象
         * @param event						调度到事件流中的 Event 对象。
         */
        protected getBubbleTargets(event: Event): IEventDispatcher[]
        {
            return [this._target[this._bubbleAttribute]];
        }

        /**
         * 添加监听
         * @param dispatcher 派发器
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        private _addEventListener(type: string, listener: (event: Event) => any, thisObject: any = null, priority: number = 0, once = false)
        {
            this._removeEventListener(type, listener, thisObject);

            var listeners: ListenerVO[] = this._listenermap[type] = this._listenermap[type] || [];
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
         * @param thisObject                listener函数作用域
         */
        private _removeEventListener(type: string, listener: (event: Event) => any, thisObject: any = null)
        {
            var listeners: ListenerVO[] = this._listenermap[type];
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
                    delete this._listenermap[type];
                }
            }
        }
    }

    /**
     * 监听数据
     */
    interface ListenerVO
    {
        /**
         * 监听函数
         */
        listener: (event: Event) => void;
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