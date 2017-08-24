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
     * 法线函数
     * @author feng 2017-03-22
     */
    var NormalMethod = (function (_super) {
        __extends(NormalMethod, _super);
        /**
         * 构建
         */
        function NormalMethod(normalUrl) {
            if (normalUrl === void 0) { normalUrl = ""; }
            var _this = _super.call(this) || this;
            _this.normalTexture = new feng3d.Texture2D(normalUrl);
            //
            _this.createUniformData("s_normal", function () { return _this.normalTexture; });
            _this.createBoolMacro("HAS_NORMAL_SAMPLER", function () { return _this.normalTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(NormalMethod.prototype, "normalTexture", {
            /**
             * 漫反射纹理
             */
            get: function () {
                return this._normalTexture;
            },
            set: function (value) {
                this._normalTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        return NormalMethod;
    }(feng3d.RenderDataHolder));
    __decorate([
        feng3d.serialize
    ], NormalMethod.prototype, "normalTexture", null);
    feng3d.NormalMethod = NormalMethod;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=NormalMethod.js.map