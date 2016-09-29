module feng3d {

    /**
     * IEventDispatcher 接口定义用于添加或删除事件侦听器的方法，检查是否已注册特定类型的事件侦听器，并调度事件。
     * @author feng 2016-3-22
     */
    export interface IEventDispatcher {

        /**
         * 名称
         */
        name: string;

        /**
         * 使用 EventDispatcher 对象注册事件侦听器对象，以使侦听器能够接收事件通知。
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        addEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority?: number): void;

        /**
		 * 从 EventDispatcher 对象中删除侦听器. 如果没有向 IEventDispatcher 对象注册任何匹配的侦听器，则对此方法的调用没有任何效果。
		 *
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeEventListener(type: string, listener: (event: Event) => void, thisObject: any): void;

        /**
		 * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEventDispatcher 对象。
		 * @param event						调度到事件流中的 Event 对象。
         */
        dispatchEvent(event: Event): void;

        /**
		 * 检查 EventDispatcher 对象是否为特定事件类型注册了任何侦听器. 
		 *
		 * @param type		事件的类型。
		 * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        hasEventListener(type: string): boolean;
    }
}