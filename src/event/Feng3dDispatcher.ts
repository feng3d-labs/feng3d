namespace feng3d
{
    /**
     * 全局事件
     */
    export var feng3dDispatcher: Feng3dDispatcher;

    export interface Feng3dEventMap
    {
        /**
         * shader资源发生变化
         */
        "assets.shaderChanged"
        /**
         * 脚本发生变化
         */
        "assets.scriptChanged"
        /**
         * 图片资源发生变化
         */
        "assets.imageAssetsChanged": { url: string }
        /**
         * 解析出资源
         */
        "assets.parsed"
    }

    export interface Feng3dDispatcher
    {
        once<K extends keyof Feng3dEventMap>(type: K, listener: (event: Event<Feng3dEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof Feng3dEventMap>(type: K, data?: Feng3dEventMap[K], bubbles?: boolean): Event<Feng3dEventMap[K]>;
        has<K extends keyof Feng3dEventMap>(type: K): boolean;
        on<K extends keyof Feng3dEventMap>(type: K, listener: (event: Event<Feng3dEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof Feng3dEventMap>(type?: K, listener?: (event: Event<Feng3dEventMap[K]>) => any, thisObject?: any);
    }

    /**
     * 全局事件
     */
    export class Feng3dDispatcher extends EventDispatcher
    {

    }

    feng3dDispatcher = new Feng3dDispatcher();
}