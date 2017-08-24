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
     * 天空盒材质
     * @author feng 2016-12-20
     */
    var SkyBoxMaterial = (function (_super) {
        __extends(SkyBoxMaterial, _super);
        function SkyBoxMaterial(images) {
            if (images === void 0) { images = null; }
            var _this = _super.call(this) || this;
            _this.shaderName = "skybox";
            if (images) {
                _this.texture = new feng3d.TextureCube(images);
            }
            //
            _this.createUniformData("s_skyboxTexture", function () { return _this.texture; });
            return _this;
        }
        Object.defineProperty(SkyBoxMaterial.prototype, "texture", {
            get: function () {
                return this._texture;
            },
            set: function (value) {
                if (this._texture == value)
                    return;
                this._texture = value;
            },
            enumerable: true,
            configurable: true
        });
        return SkyBoxMaterial;
    }(feng3d.Material));
    feng3d.SkyBoxMaterial = SkyBoxMaterial;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=SkyBoxMaterial.js.map