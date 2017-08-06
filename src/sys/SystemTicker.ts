namespace feng3d
{
    export interface TickerEventMap
    {
        /**
         * [广播事件] 进入新的一帧,监听此事件将会在下一帧开始时触发一次回调。这是一个广播事件，可以在任何一个显示对象上监听，无论它是否在显示列表中。
         */
        enterFrame;
    }

    export interface SystemTicker
    {
        once<K extends keyof TickerEventMap>(type: K, listener: (event: EventVO<TickerEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TickerEventMap>(type: K, data?: TickerEventMap[K], bubbles?: boolean);
        has<K extends keyof TickerEventMap>(type: K): boolean;
        on<K extends keyof TickerEventMap>(type: K, listener: (event: EventVO<TickerEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof TickerEventMap>(type?: K, listener?: (event: EventVO<TickerEventMap[K]>) => any, thisObject?: any);
    }

    /**
     * 心跳计时器
     */
    export class SystemTicker extends Event
    {
        private _startTime = -1;

        /**
         * 启动时间
         */
        get startTime()
        {
            return this._startTime;
        }

        /**
         * @private
         */
        constructor()
        {
            super();
            this._startTime = Date.now();
            this.init();
        }

        private init()
        {
            var requestAnimationFrame =
                window["requestAnimationFrame"] ||
                window["webkitRequestAnimationFrame"] ||
                window["mozRequestAnimationFrame"] ||
                window["oRequestAnimationFrame"] ||
                window["msRequestAnimationFrame"];

            if (!requestAnimationFrame)
            {
                requestAnimationFrame = function (callback)
                {
                    return window.setTimeout(callback, 1000 / 60);
                };
            }

            requestAnimationFrame.call(window, onTick);
            var ticker = this;
            function onTick(): void
            {
                ticker.update();
                requestAnimationFrame.call(window, onTick)
            }
        }

        /**
         * @private
         * 执行一次刷新
         */
        update(): void
        {
            this.dispatch("enterFrame");
        }
    }

    /**
     * 心跳计时器单例
     */
    export var ticker = new SystemTicker();
}