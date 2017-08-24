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
    var TerrainMergeMethod = (function (_super) {
        __extends(TerrainMergeMethod, _super);
        /**
         * 构建材质
         */
        function TerrainMergeMethod(blendUrl, splatMergeUrl, splatRepeats) {
            if (blendUrl === void 0) { blendUrl = ""; }
            if (splatMergeUrl === void 0) { splatMergeUrl = ""; }
            if (splatRepeats === void 0) { splatRepeats = new feng3d.Vector3D(1, 1, 1, 1); }
            var _this = _super.call(this) || this;
            _this.blendTexture = new feng3d.Texture2D(blendUrl);
            _this.splatMergeTexture = new feng3d.Texture2D(splatMergeUrl || "");
            _this.splatMergeTexture.minFilter = feng3d.GL.NEAREST;
            _this.splatMergeTexture.magFilter = feng3d.GL.NEAREST;
            _this.splatMergeTexture.wrapS = feng3d.GL.REPEAT;
            _this.splatMergeTexture.wrapT = feng3d.GL.REPEAT;
            _this.splatRepeats = splatRepeats;
            //
            _this.createUniformData("s_blendTexture", _this.blendTexture);
            _this.createUniformData("s_splatMergeTexture", _this.splatMergeTexture);
            _this.createUniformData("u_splatMergeTextureSize", _this.splatMergeTexture.size);
            _this.createUniformData("u_splatRepeats", _this.splatRepeats);
            //
            _this.createUniformData("u_imageSize", new feng3d.Point(2048.0, 1024.0));
            _this.createUniformData("u_tileSize", new feng3d.Point(512.0, 512.0));
            _this.createUniformData("u_maxLod", 7);
            _this.createUniformData("u_uvPositionScale", 0.001);
            _this.createUniformData("u_tileOffset", [
                new feng3d.Vector3D(0.5, 0.5, 0.0, 0.0),
                new feng3d.Vector3D(0.5, 0.5, 0.5, 0.0),
                new feng3d.Vector3D(0.5, 0.5, 0.0, 0.5),
            ]);
            _this.createUniformData("u_lod0vec", new feng3d.Vector3D(0.5, 1, 0, 0));
            _this.createBoolMacro("HAS_TERRAIN_METHOD", true);
            _this.createBoolMacro("USE_TERRAIN_MERGE", true);
            return _this;
        }
        Object.defineProperty(TerrainMergeMethod.prototype, "splatMergeTexture", {
            get: function () {
                return this._splatMergeTexture;
            },
            set: function (value) {
                this._splatMergeTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMergeMethod.prototype, "blendTexture", {
            get: function () {
                return this._blendTexture;
            },
            set: function (value) {
                this._blendTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMergeMethod.prototype, "splatRepeats", {
            get: function () {
                return this._splatRepeats;
            },
            set: function (value) {
                this._splatRepeats = value;
            },
            enumerable: true,
            configurable: true
        });
        return TerrainMergeMethod;
    }(feng3d.RenderDataHolder));
    feng3d.TerrainMergeMethod = TerrainMergeMethod;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=TerrainMergeMethod.js.map