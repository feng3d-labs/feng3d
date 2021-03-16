namespace feng3d
{

    /**
     * 只针对Object的事件
     */
    export var objectevent: ObjectEventDispatcher<Object, ObjectEventType> = event;

    /**
     * 用于适配不同对象对于的事件
     */
    export interface ObjectEventDispatcher<O, T>
    {
        once<K extends keyof T>(target: O, type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number): this;
        emit<K extends keyof T>(target: O, type: K, data?: T[K], bubbles?: boolean): boolean;
        has<K extends keyof T>(target: O, type: K): boolean;
        on<K extends keyof T>(target: O, type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number, once?: boolean): this;
        off<K extends keyof T>(target: O, type?: K, listener?: (event: Event<T[K]>) => void, thisObject?: any): this;
    }

    /**
     * Object 事件类型
     */
    export interface ObjectEventType
    {
        /**
         * 属性值变化
         */
        propertyValueChanged: { property: string, oldValue: any, newValue: any };
    }
}