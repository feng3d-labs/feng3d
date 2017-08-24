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
    var DiffuseMethod = (function (_super) {
        __extends(DiffuseMethod, _super);
        /**
         * 构建
         */
        function DiffuseMethod(diffuseUrl) {
            if (diffuseUrl === void 0) { diffuseUrl = ""; }
            var _this = _super.call(this) || this;
            /**
             * 基本颜色
             */
            _this.color = new feng3d.Color(1, 1, 1, 1);
            /**
             * 透明阈值，透明度小于该值的像素被片段着色器丢弃
             */
            _this.alphaThreshold = 0;
            _this.difuseTexture = new feng3d.Texture2D(diffuseUrl);
            _this.color = new feng3d.Color(1, 1, 1, 1);
            //
            _this.createUniformData("u_diffuse", function () { return _this.color; });
            _this.createUniformData("s_diffuse", function () { return _this.difuseTexture; });
            _this.createUniformData("u_alphaThreshold", function () { return _this.alphaThreshold; });
            _this.createBoolMacro("HAS_DIFFUSE_SAMPLER", function () { return _this.difuseTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(DiffuseMethod.prototype, "difuseTexture", {
            /**
             * 漫反射纹理
             */
            get: function () {
                return this._difuseTexture;
            },
            set: function (value) {
                this._difuseTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        return DiffuseMethod;
    }(feng3d.RenderDataHolder));
    __decorate([
        feng3d.serialize
    ], DiffuseMethod.prototype, "difuseTexture", null);
    __decorate([
        feng3d.serialize
    ], DiffuseMethod.prototype, "color", void 0);
    __decorate([
        feng3d.serialize
    ], DiffuseMethod.prototype, "alphaThreshold", void 0);
    feng3d.DiffuseMethod = DiffuseMethod;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=DiffuseMethod.js.map