module feng3d {

	/**
	 * 为了实现非flash原生显示列表的冒泡事件，自定义事件适配器
	 * @author feng 2016-3-22
	 */
    export class EventDispatcher implements IEventDispatcher {
        /**
         * 名称
         */
        public name: string;

        /** 
         * 冒泡属性名称为“parent” 
         */
        public bubbleAttribute: string = "parent";

        private _target: IEventDispatcher;
        private listenerVOUtils: ListenerVOUtils;

		/**
		 * 构建事件适配器
		 * @param target		事件适配主体
		 */
        constructor(target: IEventDispatcher = null) {
            this._target = target;
            if (this._target == null)
                this._target = this;

            this.listenerVOUtils = new ListenerVOUtils();
        }

        /**
         * 使用 EventDispatcher 对象注册事件侦听器对象，以使侦听器能够接收事件通知。
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。此函数必须接受 Event 对象作为其唯一的参数，并且不能返回任何结果，如下面的实例所示： <pre>function(evt:Event):void</pre>函数可以有任何名称。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。优先级由一个带符号的 32 位整数指定。数字越大，优先级越高。优先级为 n 的所有侦听器会在优先级为 n -1 的侦听器之前得到处理。如果两个或更多个侦听器共享相同的优先级，则按照它们的添加顺序进行处理。默认优先级为 0。
         */
        public addEventListener(type: string, listener: (event: Event) => any, thisObject: any, priority: number = 0): void {
            if (listener == null)
                return;

            var listeners: ListenerVO[] = this.listenerVOUtils.getListeners(type);
            this.listenerVOUtils.remove(listeners, listener, thisObject);
            this.listenerVOUtils.add(listeners, listener, thisObject, priority);
        }

        /**
		 * 从 EventDispatcher 对象中删除侦听器. 如果没有向 EventDispatcher 对象注册任何匹配的侦听器，则对此方法的调用没有任何效果。
		 *
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        public removeEventListener(type: string, listener: (event: Event) => any, thisObject: any): void {

            var listeners: ListenerVO[] = this.listenerVOUtils.getListeners(type);
            this.listenerVOUtils.remove(listeners, listener, thisObject);
        }

        /**
		 * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 EventDispatcher 对象。
		 *
		 * @param event						调度到事件流中的 Event 对象。如果正在重新调度事件，则会自动创建此事件的一个克隆。在调度了事件后，其 target 属性将无法更改，因此您必须创建此事件的一个新副本以能够重新调度。
		 * @return 							如果成功调度了事件，则值为 true。值 false 表示失败或对事件调用了 preventDefault()。
		 * 
         */
        public dispatchEvent(event: Event): boolean {
            //停止事件流
            if (!event || event.stopsPropagation)
                return false;

            //设置目标
            event.target = this._target;

            //处理当前事件(目标阶段)
            var listeners: ListenerVO[] = this.listenerVOUtils.getListeners(event.type);
            this.listenerVOUtils.dispatchEvent(listeners, event);

            //事件冒泡(冒泡阶段)
            if (event.bubbles && this.parentDispatcher) {
                this.parentDispatcher.dispatchEvent(event);
            }

            return event.stopsPropagation;
        }

        /**
		 * 检查 EventDispatcher 对象是否为特定事件类型注册了任何侦听器. 这样，您就可以确定 EventDispatcher 对象在事件流层次结构中的哪个位置改变了对事件类型的处理。要确定特定事件类型是否确实触发了事件侦听器，请使用 willTrigger()。
		 *
		 * @param type		事件的类型。
		 * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        public hasEventListener(type: string): boolean {

            var listeners: ListenerVO[] = this.listenerVOUtils.getListeners(type);
            return listeners.length > 0;
        }

		/**
		 * 父事件适配器
		 */
        private get parentDispatcher(): IEventDispatcher {
            return this._target[this.bubbleAttribute];
        }
    }

    /**
     * 监听数据
     */
    class ListenerVO {
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
    }

    /**
     * 监听数据工具类
     */
    class ListenerVOUtils {
        eventListeners = {};

        /**
         * 获取某类型事件的监听列表
         */
        getListeners(type): ListenerVO[] {

            var listeners: ListenerVO[] = this.eventListeners[type];
            if (listeners == null)
                listeners = this.eventListeners[type] = [];
            return listeners;
        }

        /**
         * 添加监听
         */
        add(listeners: ListenerVO[], listener: (event: Event) => any, thisObject: any = null, priority: number = 0): void {

            var addItem: ListenerVO = { listener: listener, thisObject: thisObject, priority: priority };
            for (var i = 0; i < listeners.length; i++) {
                var element = listeners[i];
                if (addItem.priority > element.priority) {
                    break;
                }
            }
            listeners.splice(i, 0, addItem);
        }

        /**
         * 移除监听
         */
        remove(listeners: ListenerVO[], listener: (event: Event) => any, thisObject: any = null): void {

            for (var i = listeners.length - 1; i >= 0; i--) {
                var element = listeners[i];
                if (element.listener == listener && element.thisObject == thisObject) {
                    listeners.splice(i, 1);
                }
            }
        }

        /**
         * 派发事件
         */
        dispatchEvent(listeners: ListenerVO[], event: Event): void {

            for (var i = 0; i < listeners.length && !event.stopsImmediatePropagation; i++) {
                var element = listeners[i];
                element.listener.call(element.thisObject, event);
            }
        }
    }
}
