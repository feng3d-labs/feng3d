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
     * 材质
     * @author feng 2016-05-02
     */
    var Material = (function (_super) {
        __extends(Material, _super);
        /**
         * 构建材质
         */
        function Material() {
            var _this = _super.call(this) || this;
            _this._pointSize = 1;
            _this._enableBlend = false;
            _this._renderMode = feng3d.RenderMode.TRIANGLES;
            /**
             * 是否渲染双面
             */
            _this.bothSides = true;
            /**
             * 混合方程，默认BlendEquation.FUNC_ADD
             */
            _this.blendEquation = feng3d.BlendEquation.FUNC_ADD;
            /**
             * 源混合因子，默认BlendFactor.SRC_ALPHA
             */
            _this.sfactor = feng3d.BlendFactor.SRC_ALPHA;
            /**
             * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
             */
            _this.dfactor = feng3d.BlendFactor.ONE_MINUS_SRC_ALPHA;
            _this._methods = [];
            _this.createShaderCode(function () { return { vertexCode: _this.vertexCode, fragmentCode: _this.fragmentCode }; });
            _this.createBoolMacro("IS_POINTS_MODE", function () { return _this.renderMode == feng3d.RenderMode.POINTS; });
            _this.createUniformData("u_PointSize", function () { return _this.pointSize; });
            _this.createShaderParam("renderMode", function () { return _this.renderMode; });
            return _this;
        }
        Object.defineProperty(Material.prototype, "renderMode", {
            /**
            * 渲染模式，默认RenderMode.TRIANGLES
            */
            get: function () {
                return this._renderMode;
            },
            set: function (value) {
                this._renderMode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "shaderName", {
            get: function () {
                return this._shaderName;
            },
            set: function (value) {
                if (this._shaderName == value)
                    return;
                this._shaderName = value;
                this._vertexCode = null;
                this._fragmentCode = null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "vertexCode", {
            /**
             * 顶点渲染程序代码
             */
            get: function () {
                if (!this._vertexCode && this._shaderName)
                    this._vertexCode = feng3d.ShaderLib.getShaderCode(this._shaderName + ".vertex");
                return this._vertexCode;
            },
            set: function (value) {
                if (this._vertexCode == value)
                    return;
                this._vertexCode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "fragmentCode", {
            /**
             * 片段渲染程序代码
             */
            get: function () {
                if (!this._fragmentCode && this._shaderName)
                    this._fragmentCode = feng3d.ShaderLib.getShaderCode(this._shaderName + ".fragment");
                return this._fragmentCode;
            },
            set: function (value) {
                if (this._fragmentCode == value)
                    return;
                this._fragmentCode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "enableBlend", {
            /**
             * 是否开启混合
             * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
             */
            get: function () {
                return this._enableBlend;
            },
            set: function (value) {
                this._enableBlend = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "pointSize", {
            /**
             * 点绘制时点的尺寸
             */
            get: function () {
                return this._pointSize;
            },
            set: function (value) {
                this._pointSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "methods", {
            get: function () {
                return this._methods;
            },
            set: function (value) {
                for (var i = 0, n = this._methods.length; i < n; i++) {
                    this.removeMethod(this._methods[i]);
                }
                for (var i = 0, n = value.length; i < n; i++) {
                    this.addMethod(value[i]);
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 添加方法
         */
        Material.prototype.addMethod = function (method) {
            var index = this._methods.indexOf(method);
            if (index != -1)
                return;
            this._methods.push(method);
            this.addRenderDataHolder(method);
        };
        /**
         * 删除方法
         */
        Material.prototype.removeMethod = function (method) {
            var index = this._methods.indexOf(method);
            if (index != -1) {
                this._methods.splice(index, 1);
                this.removeRenderDataHolder(method);
            }
        };
        return Material;
    }(feng3d.RenderDataHolder));
    __decorate([
        feng3d.serialize
    ], Material.prototype, "renderMode", null);
    __decorate([
        feng3d.serialize
    ], Material.prototype, "shaderName", null);
    __decorate([
        feng3d.serialize
    ], Material.prototype, "bothSides", void 0);
    __decorate([
        feng3d.serialize
    ], Material.prototype, "enableBlend", null);
    __decorate([
        feng3d.serialize
    ], Material.prototype, "pointSize", null);
    __decorate([
        feng3d.serialize
    ], Material.prototype, "blendEquation", void 0);
    __decorate([
        feng3d.serialize
    ], Material.prototype, "sfactor", void 0);
    __decorate([
        feng3d.serialize
    ], Material.prototype, "dfactor", void 0);
    __decorate([
        feng3d.serialize
    ], Material.prototype, "methods", null);
    feng3d.Material = Material;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Material.js.map