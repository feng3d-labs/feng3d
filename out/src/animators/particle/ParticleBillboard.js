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
    var ParticleBillboard = (function (_super) {
        __extends(ParticleBillboard, _super);
        /**
         * 创建一个广告牌节点
         * @param billboardAxis
         */
        function ParticleBillboard(camera, billboardAxis) {
            if (billboardAxis === void 0) { billboardAxis = null; }
            var _this = _super.call(this) || this;
            _this._matrix = new feng3d.Matrix3D;
            _this.billboardAxis = billboardAxis;
            _this._camera = camera;
            return _this;
        }
        ParticleBillboard.prototype.setRenderState = function (particleAnimator) {
            var gameObject = particleAnimator.gameObject;
            var comps;
            if (this._billboardAxis) {
                var pos = gameObject.transform.localToWorldMatrix.position;
                var look = this._camera.transform.localToWorldMatrix.position.subtract(pos);
                var right = look.crossProduct(this._billboardAxis);
                right.normalize();
                look = this._billboardAxis.crossProduct(right);
                look.normalize();
                //create a quick inverse projection matrix
                this._matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                comps = this._matrix.decompose(feng3d.Orientation3D.AXIS_ANGLE);
                this._matrix.copyColumnFrom(0, right);
                this._matrix.copyColumnFrom(1, this._billboardAxis);
                this._matrix.copyColumnFrom(2, look);
                this._matrix.copyColumnFrom(3, pos);
                this._matrix.appendRotation(comps[1], -comps[1].w * Math.RAD2DEG);
            }
            else {
                //create a quick inverse projection matrix
                this._matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                this._matrix.append(this._camera.transform.worldToLocalMatrix);
                //decompose using axis angle rotations
                comps = this._matrix.decompose(feng3d.Orientation3D.AXIS_ANGLE);
                //recreate the matrix with just the rotation data
                this._matrix.identity();
                this._matrix.appendRotation(comps[1], -comps[1].w * Math.RAD2DEG);
            }
            particleAnimator.animatorSet.setGlobal("billboardMatrix", this._matrix);
        };
        Object.defineProperty(ParticleBillboard.prototype, "billboardAxis", {
            /**
             * 广告牌轴线
             */
            get: function () {
                return this._billboardAxis;
            },
            set: function (value) {
                this._billboardAxis = value ? value.clone() : null;
                if (this._billboardAxis)
                    this._billboardAxis.normalize();
            },
            enumerable: true,
            configurable: true
        });
        return ParticleBillboard;
    }(feng3d.ParticleComponent));
    feng3d.ParticleBillboard = ParticleBillboard;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=ParticleBillboard.js.map