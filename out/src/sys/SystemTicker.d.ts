declare namespace feng3d {
    interface TickerEventMap {
        /**
         * [广播事件] 进入新的一帧,监听此事件将会在下一帧开始时触发一次回调。这是一个广播事件，可以在任何一个显示对象上监听，无论它是否在显示列表中。
         */
        enterFrame: any;
    }
    interface SystemTicker {
        once<K extends keyof TickerEventMap>(type: K, listener: (event: EventVO<TickerEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TickerEventMap>(type: K, data?: TickerEventMap[K], bubbles?: boolean): any;
        has<K extends keyof TickerEventMap>(type: K): boolean;
        on<K extends keyof TickerEventMap>(type: K, listener: (event: EventVO<TickerEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof TickerEventMap>(type?: K, listener?: (event: EventVO<TickerEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * 心跳计时器
     */
    class SystemTicker extends Event {
        private _startTime;
        /**
         * 启动时间
         */
        readonly startTime: number;
        /**
         * @private
         */
        constructor();
        private init();
        /**
         * @private
         * 执行一次刷新
         */
        update(): void;
    }
    /**
     * 心跳计时器单例
     */
    var ticker: SystemTicker;
}
