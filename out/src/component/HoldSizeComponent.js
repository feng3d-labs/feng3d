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
    var HoldSizeComponent = (function (_super) {
        __extends(HoldSizeComponent, _super);
        function HoldSizeComponent(gameobject) {
            var _this = _super.call(this, gameobject) || this;
            _this._holdSize = 1;
            _this.transform.on("updateLocalToWorldMatrix", _this.updateLocalToWorldMatrix, _this);
            return _this;
        }
        Object.defineProperty(HoldSizeComponent.prototype, "holdSize", {
            /**
             * 保持缩放尺寸
             */
            get: function () {
                return this._holdSize;
            },
            set: function (value) {
                if (this._holdSize == value)
                    return;
                this._holdSize = value;
                this.invalidateSceneTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoldSizeComponent.prototype, "camera", {
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
                    this._camera.transform.off("scenetransformChanged", this.invalidateSceneTransform, this);
                this._camera = value;
                if (this._camera)
                    this._camera.transform.on("scenetransformChanged", this.invalidateSceneTransform, this);
                this.invalidateSceneTransform();
            },
            enumerable: true,
            configurable: true
        });
        HoldSizeComponent.prototype.invalidateSceneTransform = function () {
            this.transform.invalidateSceneTransform();
        };
        HoldSizeComponent.prototype.updateLocalToWorldMatrix = function () {
            var _localToWorldMatrix = this.transform["_localToWorldMatrix"];
            if (this.holdSize && this._camera) {
                var depthScale = this.getDepthScale(this._camera);
                var vec = _localToWorldMatrix.decompose();
                vec[2].scaleBy(depthScale);
                _localToWorldMatrix.recompose(vec);
            }
        };
        HoldSizeComponent.prototype.getDepthScale = function (camera) {
            var cameraTranform = camera.transform.localToWorldMatrix;
            var distance = this.transform.scenePosition.subtract(cameraTranform.position);
            if (distance.length == 0)
                distance.x = 1;
            var depth = distance.dotProduct(cameraTranform.forward);
            var scale = camera.getScaleByDepth(depth);
            return scale;
        };
        HoldSizeComponent.prototype.dispose = function () {
            this.camera = null;
            this.transform.off("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
            _super.prototype.dispose.call(this);
        };
        return HoldSizeComponent;
    }(feng3d.Component));
    feng3d.HoldSizeComponent = HoldSizeComponent;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=HoldSizeComponent.js.map