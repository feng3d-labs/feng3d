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
    var SpecularMethod = (function (_super) {
        __extends(SpecularMethod, _super);
        /**
         * 构建
         */
        function SpecularMethod(specularUrl) {
            if (specularUrl === void 0) { specularUrl = ""; }
            var _this = _super.call(this) || this;
            /**
             * 镜面反射颜色
             */
            _this.specularColor = new feng3d.Color();
            /**
             * 高光系数
             */
            _this.glossiness = 50;
            _this.specularTexture = new feng3d.Texture2D(specularUrl);
            //
            _this.createUniformData("s_specular", function () { return _this.specularTexture; });
            _this.createUniformData("u_specular", function () { return _this.specularColor; });
            _this.createUniformData("u_glossiness", function () { return _this.glossiness; });
            _this.createBoolMacro("HAS_SPECULAR_SAMPLER", function () { return _this.specularTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(SpecularMethod.prototype, "specularTexture", {
            /**
             * 镜面反射光泽图
             */
            get: function () {
                return this._specularTexture;
            },
            set: function (value) {
                this._specularTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpecularMethod.prototype, "specular", {
            /**
             * 镜面反射光反射强度
             */
            get: function () {
                return this.specularColor.a;
            },
            set: function (value) {
                this.specularColor.a = value;
            },
            enumerable: true,
            configurable: true
        });
        return SpecularMethod;
    }(feng3d.RenderDataHolder));
    __decorate([
        feng3d.serialize
    ], SpecularMethod.prototype, "specularTexture", null);
    __decorate([
        feng3d.serialize
    ], SpecularMethod.prototype, "specularColor", void 0);
    __decorate([
        feng3d.serialize
    ], SpecularMethod.prototype, "specular", null);
    __decorate([
        feng3d.serialize
    ], SpecularMethod.prototype, "glossiness", void 0);
    feng3d.SpecularMethod = SpecularMethod;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=SpecularMethod.js.map