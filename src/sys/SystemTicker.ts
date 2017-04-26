module feng3d
{
    /**
     * 心跳计时器
     */
    export class SystemTicker extends EventDispatcher
    {
        private _startTime = -1;

        /**
         * 启动时间
         */
        public get startTime()
        {
            return this._startTime;
        }

        /**
         * @private
         */
        public constructor()
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
        public update(): void
        {
            this.dispatchEvent(new Event(Event.ENTER_FRAME));
        }
    }
}