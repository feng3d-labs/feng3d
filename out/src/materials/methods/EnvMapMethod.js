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
     * 环境映射函数
     */
    var EnvMapMethod = (function (_super) {
        __extends(EnvMapMethod, _super);
        /**
         * 创建EnvMapMethod实例
         * @param envMap		        环境映射贴图
         * @param reflectivity			反射率
         */
        function EnvMapMethod(envMap, reflectivity) {
            if (reflectivity === void 0) { reflectivity = 1; }
            var _this = _super.call(this) || this;
            _this._cubeTexture = envMap;
            _this.reflectivity = reflectivity;
            //
            _this.createUniformData("s_envMap", function () { return _this._cubeTexture; });
            _this.createUniformData("u_reflectivity", function () { return _this._reflectivity; });
            _this.createBoolMacro("HAS_ENV_METHOD", true);
            return _this;
        }
        Object.defineProperty(EnvMapMethod.prototype, "envMap", {
            /**
             * 环境映射贴图
             */
            get: function () {
                return this._cubeTexture;
            },
            set: function (value) {
                if (this._cubeTexture == value)
                    return;
                this._cubeTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EnvMapMethod.prototype, "reflectivity", {
            /**
             * 反射率
             */
            get: function () {
                return this._reflectivity;
            },
            set: function (value) {
                if (this._reflectivity == value)
                    return;
                this._reflectivity = value;
            },
            enumerable: true,
            configurable: true
        });
        return EnvMapMethod;
    }(feng3d.RenderDataHolder));
    feng3d.EnvMapMethod = EnvMapMethod;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=EnvMapMethod.js.map