declare namespace feng3d {
    /**
     * 事件
     */
    export var event: FEvent;
    /**
     * 用于适配不同对象对于的事件
     */
    export interface ObjectEventDispatcher<O, T> {
        once<K extends keyof T>(target: O, type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(target: O, type: K, data?: T[K], bubbles?: boolean): Event<T[K]>;
        has<K extends keyof T>(target: O, type: K): boolean;
        on<K extends keyof T>(target: O, type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof T>(target: O, type?: K, listener?: (event: Event<T[K]>) => void, thisObject?: any): void;
    }
    /**
     * 事件
     */
    export class FEvent {
        private feventMap;
        private getBubbleTargets;
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的监听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        once(obj: Object, type: string, listener: (event: Event<any>) => void, thisObject?: null, priority?: number): void;
        /**
         * 派发事件
         *
         * 当事件重复流向一个对象时将不会被处理。
         *
         * @param e                 事件对象。
         * @returns                 返回事件是否被该对象处理。
         */
        dispatchEvent(obj: Object, e: Event<any>): boolean;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch(obj: Object, type: string, data?: any, bubbles?: boolean): Event<any>;
        /**
         * 检查 被监听对象 是否为特定事件类型注册了任何监听器.
         *
         * @param obj                       被监听对象。
         * @param type		                事件的类型。
         * @return 			                如果指定类型的监听器已注册，则值为 true；否则，值为 false。
         */
        has(obj: Object, type: string): boolean;
        /**
         * 为监听对象新增指定类型的事件监听。
         *
         * @param obj                       被监听对象。
         * @param type						事件的类型。
         * @param listener					处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority					事件监听器的优先级。数字越大，优先级越高。默认为0。
         * @param once                      值为true时在监听一次事件后该监听器将被移除。默认为false。
         */
        on(obj: Object, type: string, listener: (event: Event<any>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        /**
         * 移除监听
         *
         * @param obj                       被监听对象。
         * @param type						事件的类型。可选。该值为空时所有被监听对象上的监听均将被移除。
         * @param listener					要删除的监听器对象。可选。该值为空时所有指定类型的监听均将被移除。
         * @param thisObject                监听器的上下文。可选。
         */
        off(obj: Object, type?: string, listener?: (event: Event<any>) => any, thisObject?: any): void;
        /**
         * 监听对象的任意事件，该对象的任意事件都将触发该监听器的调用。
         *
         * @param obj                       被监听对象。
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority                  事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        onAny(obj: Object, listener: (event: Event<any>) => void, thisObject?: any, priority?: number): void;
        /**
         * 移除监听对象的任意事件。
         *
         * @param obj                       被监听对象。
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         */
        offAny(obj: Object, listener?: (event: any) => void, thisObject?: any): void;
        /**
         * 初始化事件对象
         *
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        makeEvent<T>(type: string, data: T, bubbles?: boolean): Event<T>;
        /**
         * 处理事件
         * @param e 事件
         */
        protected handleEvent(obj: Object, e: Event<any>): void;
        /**
         * 处理事件冒泡
         * @param e 事件
         */
        protected handelEventBubbles(obj: Object, e: Event<any>): void;
    }
    /**
     * 事件
     */
    export interface Event<T> {
        /**
         * 事件的类型。类型区分大小写。
         */
        type: string;
        /**
         * 事件携带的自定义数据
         */
        data: T;
        /**
         * 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        bubbles: boolean;
        /**
         * 事件目标。
         */
        target: any;
        /**
         * 当前正在使用某个事件监听器处理 Event 对象的对象。
         */
        currentTarget: any;
        /**
         * 是否停止处理事件监听器
         */
        isStop: boolean;
        /**
         * 是否停止冒泡
         */
        isStopBubbles: boolean;
        /**
         * 事件流过的对象列表，事件路径
         */
        targets: any[];
        /**
         * 处理列表
         */
        handles: ListenerVO[];
    }
    /**
     * 监听数据
     */
    interface ListenerVO {
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
    export {};
}
declare namespace feng3d {
    interface IEventDispatcher<T> {
        once<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(type: K, data?: T[K], bubbles?: boolean): Event<T[K]>;
        has<K extends keyof T>(type: K): boolean;
        on<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof T>(type?: K, listener?: (event: Event<T[K]>) => void, thisObject?: any): void;
    }
    /**
     * 事件适配器
     */
    class EventDispatcher {
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once(type: string, listener: (event: Event<any>) => void, thisObject?: null, priority?: number): void;
        /**
         * 派发事件
         *
         * 当事件重复流向一个对象时将不会被处理。
         *
         * @param e   事件对象
         * @returns 返回事件是否被该对象处理
         */
        dispatchEvent(e: Event<any>): boolean;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch(type: string, data?: any, bubbles?: boolean): Event<any>;
        /**
         * 检查 Event 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        has(type: string): boolean;
        /**
         * 添加监听
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on(type: string, listener: (event: Event<any>) => void, thisObject?: any, priority?: number, once?: boolean): void;
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         */
        off(type?: string, listener?: (event: Event<any>) => void, thisObject?: any): void;
        /**
         * 监听对象的任意事件，该对象的任意事件都将触发该监听器的调用。
         *
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority                  事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        onAny(listener: (event: Event<any>) => void, thisObject?: any, priority?: number): void;
        /**
         * 移除监听对象的任意事件。
         *
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         */
        offAny(listener?: (event: Event<any>) => void, thisObject?: any): void;
        /**
         * 处理事件
         * @param e 事件
         */
        protected handleEvent(e: Event<any>): void;
        /**
         * 处理事件冒泡
         * @param e 事件
         */
        protected handelEventBubbles(e: Event<any>): void;
    }
}
declare namespace feng3d {
    /**
     * 只针对Object的事件
     */
    var objectevent: ObjectEventDispatcher<Object, ObjectEventType>;
    /**
     * Object 事件类型
     */
    interface ObjectEventType {
        /**
         * 属性值变化
         */
        propertyValueChanged: {
            property: string;
            oldValue: any;
            newValue: any;
        };
    }
}
//# sourceMappingURL=evnet.d.ts.map