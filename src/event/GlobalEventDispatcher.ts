namespace feng3d
{
    /**
     * 全局事件
     */
    export var globalEvent: GlobalEventDispatcher;

    export interface GlobalEventMap
    {
        /**
         * shader资源发生变化
         */
        shaderChanged
        /**
         * 脚本发生变化
         */
        scriptChanged
        /**
         * 图片资源发生变化
         */
        imageAssetsChanged: { url: string }
    }

    export interface GlobalEventDispatcher
    {
        once<K extends keyof GlobalEventMap>(type: K, listener: (event: Event<GlobalEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GlobalEventMap>(type: K, data?: GlobalEventMap[K], bubbles?: boolean);
        has<K extends keyof GlobalEventMap>(type: K): boolean;
        on<K extends keyof GlobalEventMap>(type: K, listener: (event: Event<GlobalEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof GlobalEventMap>(type?: K, listener?: (event: Event<GlobalEventMap[K]>) => any, thisObject?: any);
    }

    /**
     * 全局事件
     */
    export class GlobalEventDispatcher extends EventDispatcher
    {

    }

    globalEvent = new GlobalEventDispatcher();
}