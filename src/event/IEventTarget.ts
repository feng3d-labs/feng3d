namespace feng3d
{

    /**
     * 派发事件的对象。
     */
    export interface IEventTarget
    {
        /**
         * 获取分享的平级目标列表。
         */
        getShareTargets?(): IEventTarget[];

        /**
         * 获取报告的上级目标列表。
         */
        getBubbleTargets?(): IEventTarget[];

        /**
         * 获取广播的下级目标列表。
         */
        getBroadcastTargets?(): IEventTarget[];
    }
}