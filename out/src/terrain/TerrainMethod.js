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
     * 地形材质
     * @author feng 2016-04-28
     */
    var TerrainMethod = (function (_super) {
        __extends(TerrainMethod, _super);
        /**
         * 构建材质
         */
        function TerrainMethod(blendUrl, splatUrls, splatRepeats) {
            if (blendUrl === void 0) { blendUrl = ""; }
            if (splatUrls === void 0) { splatUrls = ["", "", ""]; }
            if (splatRepeats === void 0) { splatRepeats = new feng3d.Vector3D(1, 1, 1, 1); }
            var _this = _super.call(this) || this;
            _this.blendTexture = new feng3d.Texture2D(blendUrl);
            _this.splatTexture1 = new feng3d.Texture2D(splatUrls[0] || "");
            _this.splatTexture2 = new feng3d.Texture2D(splatUrls[1] || "");
            _this.splatTexture3 = new feng3d.Texture2D(splatUrls[2] || "");
            _this.splatTexture1.generateMipmap = true;
            _this.splatTexture1.minFilter = feng3d.GL.LINEAR_MIPMAP_LINEAR;
            _this.splatTexture1.wrapS = feng3d.GL.REPEAT;
            _this.splatTexture1.wrapT = feng3d.GL.REPEAT;
            _this.splatTexture2.generateMipmap = true;
            _this.splatTexture2.minFilter = feng3d.GL.LINEAR_MIPMAP_LINEAR;
            _this.splatTexture2.wrapS = feng3d.GL.REPEAT;
            _this.splatTexture2.wrapT = feng3d.GL.REPEAT;
            _this.splatTexture3.generateMipmap = true;
            _this.splatTexture3.minFilter = feng3d.GL.LINEAR_MIPMAP_LINEAR;
            _this.splatTexture3.wrapS = feng3d.GL.REPEAT;
            _this.splatTexture3.wrapT = feng3d.GL.REPEAT;
            _this.splatRepeats = splatRepeats;
            //
            _this.createUniformData("s_blendTexture", function () { return _this.blendTexture; });
            _this.createUniformData("s_splatTexture1", function () { return _this.splatTexture1; });
            _this.createUniformData("s_splatTexture2", function () { return _this.splatTexture2; });
            _this.createUniformData("s_splatTexture3", function () { return _this.splatTexture3; });
            _this.createUniformData("u_splatRepeats", function () { return _this.splatRepeats; });
            _this.createBoolMacro("HAS_TERRAIN_METHOD", function () {
                return _this.blendTexture.checkRenderData()
                    && _this.splatTexture1.checkRenderData()
                    && _this.splatTexture2.checkRenderData()
                    && _this.splatTexture3.checkRenderData();
            });
            return _this;
        }
        Object.defineProperty(TerrainMethod.prototype, "splatTexture1", {
            get: function () {
                return this._splatTexture1;
            },
            set: function (value) {
                this._splatTexture1 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "splatTexture2", {
            get: function () {
                return this._splatTexture2;
            },
            set: function (value) {
                this._splatTexture2 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "splatTexture3", {
            get: function () {
                return this._splatTexture3;
            },
            set: function (value) {
                this._splatTexture3 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "blendTexture", {
            get: function () {
                return this._blendTexture;
            },
            set: function (value) {
                this._blendTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "splatRepeats", {
            get: function () {
                return this._splatRepeats;
            },
            set: function (value) {
                this._splatRepeats = value;
            },
            enumerable: true,
            configurable: true
        });
        return TerrainMethod;
    }(feng3d.RenderDataHolder));
    feng3d.TerrainMethod = TerrainMethod;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=TerrainMethod.js.map