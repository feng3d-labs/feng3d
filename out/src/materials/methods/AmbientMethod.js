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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var feng3d;
(function (feng3d) {
    /**
     * 漫反射函数
     * @author feng 2017-03-22
     */
    var AmbientMethod = (function (_super) {
        __extends(AmbientMethod, _super);
        /**
         * 构建
         */
        function AmbientMethod(ambientUrl, color) {
            if (ambientUrl === void 0) { ambientUrl = ""; }
            if (color === void 0) { color = null; }
            var _this = _super.call(this) || this;
            _this.ambientTexture = new feng3d.Texture2D(ambientUrl);
            _this.color = color || new feng3d.Color();
            //
            _this.createUniformData("u_ambient", function () { return _this._color; });
            _this.createUniformData("s_ambient", function () { return _this._ambientTexture; });
            _this.createBoolMacro("HAS_AMBIENT_SAMPLER", function () { return _this.ambientTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(AmbientMethod.prototype, "ambientTexture", {
            /**
             * 环境纹理
             */
            get: function () {
                return this._ambientTexture;
            },
            set: function (value) {
                this._ambientTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AmbientMethod.prototype, "color", {
            /**
             * 颜色
             */
            get: function () {
                return this._color;
            },
            set: function (value) {
                this._color = value;
            },
            enumerable: true,
            configurable: true
        });
        return AmbientMethod;
    }(feng3d.RenderDataHolder));
    __decorate([
        feng3d.serialize
    ], AmbientMethod.prototype, "ambientTexture", null);
    __decorate([
        feng3d.serialize
    ], AmbientMethod.prototype, "color", null);
    feng3d.AmbientMethod = AmbientMethod;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=AmbientMethod.js.map