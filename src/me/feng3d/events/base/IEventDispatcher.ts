module feng3d {

    /**
     * IEventDispatcher 接口定义用于添加或删除事件侦听器的方法，检查是否已注册特定类型的事件侦听器，并调度事件。
     * @author feng 2016-3-22
     */
    export interface IEventDispatcher {

        /**
         * 使用 EventDispatcher 对象注册事件侦听器对象，以使侦听器能够接收事件通知。
         */
        addEventListener(type: string, listener: Function, priority: number, useWeakReference: Boolean): void;

        /**
         * 将事件调度到事件流中。
         */
        dispatchEvent(event: Event): Boolean;

        /**
         * 检查 EventDispatcher 对象是否为特定事件类型注册了任何侦听器。
         */
        hasEventListener(type: string): Boolean;

        /**
         * 从 EventDispatcher 对象中删除侦听器。
         */
        removeEventListener(type: string, listener: Function): void;

        /**
         * 检查是否用此 EventDispatcher 对象或其任何祖代为指定事件类型注册了事件侦听器。
         */
        willTrigger(type: string): Boolean;
    }
}