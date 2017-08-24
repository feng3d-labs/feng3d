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
     * 点光源
     * @author feng 2016-12-13
     */
    var PointLight = (function (_super) {
        __extends(PointLight, _super);
        /**
         * 构建
         */
        function PointLight(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            /**
             * 光照范围
             */
            _this.range = 600;
            _this.lightType = feng3d.LightType.Point;
            PointLight._pointLights.push(_this);
            return _this;
        }
        Object.defineProperty(PointLight, "pointLights", {
            get: function () {
                return this._pointLights;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PointLight.prototype, "position", {
            /**
             * 灯光位置
             */
            get: function () {
                return this.gameObject.transform.scenePosition;
            },
            enumerable: true,
            configurable: true
        });
        return PointLight;
    }(feng3d.Light));
    PointLight._pointLights = [];
    feng3d.PointLight = PointLight;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=PointLight.js.map