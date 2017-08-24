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
    var FogMethod = (function (_super) {
        __extends(FogMethod, _super);
        /**
         * @param fogColor      雾颜色
         * @param minDistance   雾近距离
         * @param maxDistance   雾远距离
         * @param density       雾浓度
         */
        function FogMethod(fogColor, minDistance, maxDistance, density, mode) {
            if (fogColor === void 0) { fogColor = new feng3d.Color(); }
            if (minDistance === void 0) { minDistance = 0; }
            if (maxDistance === void 0) { maxDistance = 100; }
            if (density === void 0) { density = 0.1; }
            if (mode === void 0) { mode = FogMode.LINEAR; }
            var _this = _super.call(this) || this;
            _this._minDistance = 0;
            _this._maxDistance = 100;
            _this._fogColor = fogColor;
            _this._minDistance = minDistance;
            _this._maxDistance = maxDistance;
            _this._density = density;
            _this._mode = mode;
            //
            _this.createUniformData("u_fogColor", _this._fogColor);
            _this.createUniformData("u_fogMinDistance", _this._minDistance);
            _this.createUniformData("u_fogMaxDistance", _this._maxDistance);
            _this.createUniformData("u_fogDensity", _this._density);
            _this.createUniformData("u_fogMode", _this._mode);
            _this.createBoolMacro("HAS_FOG_METHOD", true);
            _this.createAddMacro("V_GLOBAL_POSITION_NEED", 1);
            return _this;
        }
        Object.defineProperty(FogMethod.prototype, "minDistance", {
            /**
             * 出现雾效果的最近距离
             */
            get: function () {
                return this._minDistance;
            },
            set: function (value) {
                this._minDistance = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "maxDistance", {
            /**
             * 最远距离
             */
            get: function () {
                return this._maxDistance;
            },
            set: function (value) {
                this._maxDistance = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "fogColor", {
            /**
             * 雾的颜色
             */
            get: function () {
                return this._fogColor;
            },
            set: function (value) {
                this._fogColor = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "density", {
            get: function () {
                return this._density;
            },
            set: function (value) {
                this.density = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "mode", {
            /**
             * 雾模式
             */
            get: function () {
                return this._mode;
            },
            set: function (value) {
                this._mode = value;
            },
            enumerable: true,
            configurable: true
        });
        return FogMethod;
    }(feng3d.RenderDataHolder));
    feng3d.FogMethod = FogMethod;
    /**
     * 雾模式
     */
    var FogMode;
    (function (FogMode) {
        FogMode[FogMode["NONE"] = 0] = "NONE";
        FogMode[FogMode["EXP"] = 1] = "EXP";
        FogMode[FogMode["EXP2"] = 2] = "EXP2";
        FogMode[FogMode["LINEAR"] = 3] = "LINEAR";
    })(FogMode = feng3d.FogMode || (feng3d.FogMode = {}));
})(feng3d || (feng3d = {}));
//# sourceMappingURL=FogMethod.js.map