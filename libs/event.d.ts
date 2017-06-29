declare namespace feng3d {
    interface EventType {
        /**
         * 发生变化时派发
         */
        change: any;
    }
    /**
     * 事件
     */
    interface EventVO<K extends keyof EventType> {
        /**
         * 事件的类型。类型区分大小写。
         */
        type: K;
        /**
         * 事件携带的自定义数据
         */
        data: EventType[K];
        /**
         * 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        bubbles: boolean;
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
        isStop?: boolean;
        /**
         * 是否停止冒泡
         */
        isStopBubbles?: boolean;
    }
    /**
     * 事件适配器
     */
    class Event {
        private static getBubbleTargets(target);
        private static listenermap;
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        static once<K extends keyof EventType>(target: any, type: K, listener: (event: EventVO<K>) => void, thisObject: any, priority?: number): void;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param target                    事件主体
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                      表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        static dispatch<K extends keyof EventType>(target: any, type: K, data?: EventType[K], bubbles?: boolean): void;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param target                    事件主体
         * @param event						调度到事件流中的 Event 对象。
         */
        private static _dispatch(target, event);
        /**
         * 检查 Event 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        static has<K extends keyof EventType>(target: any, type: K): boolean;
        /**
         * 添加监听
         * @param dispatcher 派发器
         * @param target                    事件主体
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        static on<K extends keyof EventType>(target: any, type: K, listener: (event: EventVO<K>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param target                    事件主体
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        static off<K extends keyof EventType>(target: any, type: K, listener: (event: EventVO<K>) => any, thisObject?: any): void;
    }
}
