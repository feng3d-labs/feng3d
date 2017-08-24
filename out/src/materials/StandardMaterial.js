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
     * 标准材质
     * @author feng 2016-05-02
     */
    var StandardMaterial = (function (_super) {
        __extends(StandardMaterial, _super);
        /**
         * 构建
         */
        function StandardMaterial(diffuseUrl, normalUrl, specularUrl, ambientUrl) {
            if (diffuseUrl === void 0) { diffuseUrl = ""; }
            if (normalUrl === void 0) { normalUrl = ""; }
            if (specularUrl === void 0) { specularUrl = ""; }
            if (ambientUrl === void 0) { ambientUrl = ""; }
            var _this = _super.call(this) || this;
            _this.shaderName = "standard";
            _this.diffuseMethod = new feng3d.DiffuseMethod(diffuseUrl);
            _this.normalMethod = new feng3d.NormalMethod(normalUrl);
            _this.specularMethod = new feng3d.SpecularMethod(specularUrl);
            _this.ambientMethod = new feng3d.AmbientMethod(ambientUrl);
            return _this;
        }
        Object.defineProperty(StandardMaterial.prototype, "diffuseMethod", {
            /**
             * 漫反射函数
             */
            get: function () {
                return this._diffuseMethod;
            },
            set: function (value) {
                this._diffuseMethod = value;
                if (this._diffuseMethod)
                    this.addMethod(this._diffuseMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "normalMethod", {
            /**
             * 法线函数
             */
            get: function () {
                return this._normalMethod;
            },
            set: function (value) {
                this._normalMethod = value;
                if (this._normalMethod)
                    this.addMethod(this._normalMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "specularMethod", {
            /**
             * 镜面反射函数
             */
            get: function () {
                return this._specularMethod;
            },
            set: function (value) {
                this._specularMethod = value;
                if (this._specularMethod)
                    this.addMethod(this._specularMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "ambientMethod", {
            /**
             * 环境反射函数
             */
            get: function () {
                return this._ambientMethod;
            },
            set: function (value) {
                this._ambientMethod = value;
                if (this._ambientMethod)
                    this.addMethod(this._ambientMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "enableBlend", {
            // /**
            //  * 反射率
            //  */
            // reflectance = 1.0;
            // /**
            //  * 粗糙度
            //  */
            // roughness = 1.0;
            // /**
            //  * 金属度
            //  */
            // metalic = 1.0;
            /**
             * 是否开启混合
             */
            get: function () {
                return this._enableBlend || this.diffuseMethod.color.a != 1.0;
            },
            set: function (value) {
                this._enableBlend = value;
            },
            enumerable: true,
            configurable: true
        });
        return StandardMaterial;
    }(feng3d.Material));
    feng3d.StandardMaterial = StandardMaterial;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=StandardMaterial.js.map