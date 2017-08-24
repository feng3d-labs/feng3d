var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var feng3d;
(function (feng3d) {
    /**
     * 心跳计时器
     */
    var SystemTicker = (function (_super) {
        __extends(SystemTicker, _super);
        /**
         * @private
         */
        function SystemTicker() {
            var _this = _super.call(this) || this;
            _this._startTime = -1;
            _this._startTime = Date.now();
            _this.init();
            return _this;
        }
        Object.defineProperty(SystemTicker.prototype, "startTime", {
            /**
             * 启动时间
             */
            get: function () {
                return this._startTime;
            },
            enumerable: true,
            configurable: true
        });
        SystemTicker.prototype.init = function () {
            var requestAnimationFrame = window["requestAnimationFrame"] ||
                window["webkitRequestAnimationFrame"] ||
                window["mozRequestAnimationFrame"] ||
                window["oRequestAnimationFrame"] ||
                window["msRequestAnimationFrame"];
            if (!requestAnimationFrame) {
                requestAnimationFrame = function (callback) {
                    return window.setTimeout(callback, 1000 / 60);
                };
            }
            requestAnimationFrame.call(window, onTick);
            var ticker = this;
            function onTick() {
                ticker.update();
                requestAnimationFrame.call(window, onTick);
            }
        };
        /**
         * @private
         * 执行一次刷新
         */
        SystemTicker.prototype.update = function () {
            this.dispatch("enterFrame");
        };
        return SystemTicker;
    }(feng3d.Event));
    feng3d.SystemTicker = SystemTicker;
    /**
     * 心跳计时器单例
     */
    feng3d.ticker = new SystemTicker();
})(feng3d || (feng3d = {}));
//# sourceMappingURL=SystemTicker.js.map