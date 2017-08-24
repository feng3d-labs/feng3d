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
    var BillboardComponent = (function (_super) {
        __extends(BillboardComponent, _super);
        function BillboardComponent(gameobject) {
            var _this = _super.call(this, gameobject) || this;
            _this._holdSize = 1;
            _this.transform.on("updateLocalToWorldMatrix", _this.updateLocalToWorldMatrix, _this);
            return _this;
        }
        Object.defineProperty(BillboardComponent.prototype, "camera", {
            /**
             * 相对
             */
            get: function () {
                return this._camera;
            },
            set: function (value) {
                if (this._camera == value)
                    return;
                if (this._camera)
                    this._camera.transform.off("scenetransformChanged", this.invalidHoldSizeMatrix, this);
                this._camera = value;
                if (this._camera)
                    this._camera.transform.on("scenetransformChanged", this.invalidHoldSizeMatrix, this);
                this.invalidHoldSizeMatrix();
            },
            enumerable: true,
            configurable: true
        });
        BillboardComponent.prototype.invalidHoldSizeMatrix = function () {
            this.transform.invalidateSceneTransform();
        };
        BillboardComponent.prototype.updateLocalToWorldMatrix = function () {
            var _localToWorldMatrix = this.transform["_localToWorldMatrix"];
            if (this._camera) {
                var camera = this._camera;
                var cameraPos = camera.transform.scenePosition;
                var yAxis = camera.transform.localToWorldMatrix.up;
                _localToWorldMatrix.lookAt(cameraPos, yAxis);
            }
        };
        BillboardComponent.prototype.dispose = function () {
            this.camera = null;
            this.transform.off("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
            _super.prototype.dispose.call(this);
        };
        return BillboardComponent;
    }(feng3d.Component));
    feng3d.BillboardComponent = BillboardComponent;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=BillboardComponent.js.map