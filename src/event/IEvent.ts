namespace feng3d
{

    /**
     * 事件
     */
    export interface IEvent<T = any>
    {
        /**
         * 事件的类型。类型区分大小写。
         */
        type: string;

        /**
         * 事件携带的自定义数据
         */
        data: T;

        /**
         * 事件目标。
         */
        target: IEventTarget;

        /**
         * 当前正在处理事件监听的事件对象。
         */
        currentTarget: IEventTarget;

        /**
         * 是否向平级分享事件。
         *
         * 如果值为`true`，则向平级分享事件，分享对象将由`IEventTarget.getShareTargets?()`获取。
         */
        share: boolean;

        /**
         * 是否停止向平级分享事件。
         */
        isStopShare: boolean;

        /**
         * 是否向上级报告事件。
         *
         * 如果值为`true`，则向上级报告事件，报告对象将由`IEventTarget.getBubbleTargets?()`获取。
         */
        bubbles: boolean;

        /**
         * 是否停止向上级报告事件。
         */
        isStopBubbles: boolean;

        /**
         * 是否向下级广播事件。
         *
         * 如果值为`true`，则向下级广播事件，广播对象将由`IEventTarget.getBroadcastTargets?()`获取。
         */
        broadcast: boolean;

        /**
         * 是否停止向下级广播事件。
         */
        isStopBroadcast: boolean;

        /**
         * 是否停止传播事件。
         *
         * 如果值为`true`，则停止事件传递（向平级分享、向上级报告、向下级广播）。
         */
        isStopTransmit: boolean;

        /**
         * 是否停止事件。
         *
         * 如果值为`true`，则停止事件传递（向平级分享、向上级报告、向下级广播），并且停止后续的事件监听器的执行。
         */
        isStop: boolean;

        /**
         * 事件流过的对象列表，事件路径
         */
        targets: any[];

        /**
         * 已处理的监听器列表。
         */
        handles: IEventListener[];
    }
}