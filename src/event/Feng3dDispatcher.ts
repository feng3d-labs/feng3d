namespace feng3d
{
    /**
     * 全局事件
     */
    export var feng3dDispatcher: IEventDispatcher<Feng3dEventMap> = new EventDispatcher();

    export interface Feng3dEventMap
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
    }
}