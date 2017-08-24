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
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    var Script = (function (_super) {
        __extends(Script, _super);
        function Script(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            /**
             * 脚本路径
             */
            _this.url = "";
            _this._enabled = false;
            _this.init();
            return _this;
        }
        Object.defineProperty(Script.prototype, "enabled", {
            /**
             * Enabled Behaviours are Updated, disabled Behaviours are not.
             */
            get: function () {
                return this._enabled;
            },
            set: function (value) {
                if (this._enabled == value)
                    return;
                if (this._enabled)
                    feng3d.ticker.off("enterFrame", this.update, this);
                this._enabled = value;
                if (this._enabled)
                    feng3d.ticker.on("enterFrame", this.update, this);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 初始化
         */
        Script.prototype.init = function () {
        };
        /**
         * 更新
         */
        Script.prototype.update = function () {
        };
        /**
         * 销毁
         */
        Script.prototype.dispose = function () {
            this.enabled = false;
        };
        return Script;
    }(feng3d.Component));
    feng3d.Script = Script;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Object3dScript.js.map