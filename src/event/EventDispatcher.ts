namespace feng3d
{
    /**
     * 全局事件
     */
    export var globalDispatcher: IEventDispatcher<GlobalEvents>;

    export interface GlobalEvents
    {
        /**
         * shader资源发生变化
         */
        "asset.shaderChanged"
        /**
         * 脚本发生变化
         */
        "asset.scriptChanged"
        /**
         * 图片资源发生变化
         */
        "asset.imageAssetChanged": { url: string }
        /**
         * 解析出资源
         */
        "asset.parsed"
        /**
         * 删除文件
         */
        "fs.delete": string;
        /**
         * 写文件
         */
        "fs.write": string;
    }

    export interface IEventDispatcher<T>
    {
        once<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(type: K, data?: T[K], bubbles?: boolean): Event<T[K]>;
        has<K extends keyof T>(type: K): boolean;
        on<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof T>(type?: K, listener?: (event: Event<T[K]>) => void, thisObject?: any): void;
    }

	/**
	 * 事件适配器
	 */
    export class EventDispatcher
    {
        /**
         * 监听一次事件后将会被移除
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once(type: string, listener: (event: any) => void, thisObject = null, priority = 0)
        {
            event.on(this, type, listener, thisObject, priority, true);
        }

        /**
         * 派发事件
         * 
         * 当事件重复流向一个对象时将不会被处理。
         * 
         * @param e   事件对象
         * @returns 返回事件是否被该对象处理
         */
        dispatchEvent(e: Event<any>)
        {
            return event.dispatchEvent(this, e);
        }

        /**
		 * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
		 * @param type                      事件的类型。类型区分大小写。
		 * @param data                      事件携带的自定义数据。
		 * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch(type: string, data?: any, bubbles = false)
        {
            return event.dispatch(this, type, data, bubbles);
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
        on(type: string, listener: (event: any) => void, thisObject?: any, priority = 0, once = false)
        {
            event.on(this, type, listener, thisObject, priority, once);
        }

        /**
         * 移除监听
         * @param dispatcher 派发器
		 * @param type						事件的类型。
		 * @param listener					要删除的侦听器对象。
         */
        off(type?: string, listener?: (event: any) => void, thisObject?: any)
        {
            event.off(this, type, listener, thisObject);
        }

        /**
         * 监听对象的所有事件
         * @param obj 被监听对象
         * @param listener 回调函数
         * @param thisObject 回调函数 this 指针
         * @param priority 优先级
         */
        onAll(listener: (event: any) => void, thisObject?: any, priority = 0)
        {
            event.onAll(this, listener, thisObject, priority);
        }

        /**
         * 移除监听对象的所有事件
         * @param obj 被监听对象
         * @param listener 回调函数
         * @param thisObject 回调函数 this 指针
         */
        offAll(listener?: (event: any) => void, thisObject?: any)
        {
            event.offAll(this, listener, thisObject);
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
    globalDispatcher = new EventDispatcher();
}