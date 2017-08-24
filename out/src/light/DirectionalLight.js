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
     * 方向光源
     * @author feng 2016-12-13
     */
    var DirectionalLight = (function (_super) {
        __extends(DirectionalLight, _super);
        /**
         * 构建
         */
        function DirectionalLight(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            _this.lightType = feng3d.LightType.Directional;
            var xDir = 0, yDir = -1, zDir = 1;
            _this._sceneDirection = new feng3d.Vector3D();
            _this.direction = new feng3d.Vector3D(xDir, yDir, zDir);
            //
            DirectionalLight._directionalLights.push(_this);
            //
            _this.gameObject.transform.on("scenetransformChanged", _this.onScenetransformChanged, _this);
            var tmpLookAt = _this.gameObject.transform.position;
            tmpLookAt.incrementBy(_this._direction);
            _this.gameObject.transform.lookAt(tmpLookAt);
            return _this;
        }
        Object.defineProperty(DirectionalLight, "directionalLights", {
            get: function () {
                return this._directionalLights;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DirectionalLight.prototype, "sceneDirection", {
            get: function () {
                return this._sceneDirection;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DirectionalLight.prototype, "direction", {
            /**
             * 光照方向
             */
            get: function () {
                return this._direction;
            },
            set: function (value) {
                this._direction = value;
                if (this.gameObject) {
                    var tmpLookAt = this.gameObject.transform.position;
                    tmpLookAt.incrementBy(this._direction);
                    this.gameObject.transform.lookAt(tmpLookAt);
                    this.gameObject.transform.localToWorldMatrix.copyColumnTo(2, this._sceneDirection);
                    this._sceneDirection.normalize();
                }
            },
            enumerable: true,
            configurable: true
        });
        DirectionalLight.prototype.onScenetransformChanged = function () {
            this.gameObject.transform.localToWorldMatrix.copyColumnTo(2, this._sceneDirection);
            this._sceneDirection.normalize();
        };
        /**
         * 销毁
         */
        DirectionalLight.prototype.dispose = function () {
            this.gameObject.transform.off("scenetransformChanged", this.onScenetransformChanged, this);
            _super.prototype.dispose.call(this);
        };
        return DirectionalLight;
    }(feng3d.Light));
    DirectionalLight._directionalLights = [];
    feng3d.DirectionalLight = DirectionalLight;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=DirectionalLight.js.map