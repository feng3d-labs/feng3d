module feng3d {

    /**
     * 心跳计时器
     */
    export class SystemTicker extends EventDispatcher {
        /**
         * @private
         */
        public constructor() {
            $feng3dStartTime = Date.now();
            super();
            if ($ticker) {
                throw "心跳计时器为单例";
            }
            this.init();
        }

        private init() {
            var requestAnimationFrame =
                window["requestAnimationFrame"] ||
                window["webkitRequestAnimationFrame"] ||
                window["mozRequestAnimationFrame"] ||
                window["oRequestAnimationFrame"] ||
                window["msRequestAnimationFrame"];

            if (!requestAnimationFrame) {
                requestAnimationFrame = function(callback) {
                    return window.setTimeout(callback, 1000 / 60);
                };
            }

            requestAnimationFrame.call(window, onTick);
            function onTick(): void {
                $ticker.update();
                requestAnimationFrame.call(window, onTick)
            }
        }

        /**
         * @private
         * 执行一次刷新
         */
        public update(): void {
            this.dispatchEvent(new Event(Event.ENTER_FRAME));
        }
    }

    /**
     * 心跳计时器单例
     */
    export var $ticker: SystemTicker = new SystemTicker();
    export var $feng3dStartTime: number = -1;
}