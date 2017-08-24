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
     * 灯光
     * @author feng 2016-12-12
     */
    var Light = (function (_super) {
        __extends(Light, _super);
        function Light(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            /**
             * 颜色
             */
            _this.color = new feng3d.Color();
            /**
             * 光照强度
             */
            _this.intensity = 1;
            /**
             * 是否生成阴影（未实现）
             */
            _this.castsShadows = false;
            _this._shadowMap = new feng3d.Texture2D();
            Light._lights.push(_this);
            return _this;
        }
        Object.defineProperty(Light, "lights", {
            get: function () {
                return this._lights;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Light.prototype, "shadowMap", {
            get: function () {
                return this._shadowMap;
            },
            enumerable: true,
            configurable: true
        });
        return Light;
    }(feng3d.Component));
    Light._lights = [];
    feng3d.Light = Light;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Light.js.map