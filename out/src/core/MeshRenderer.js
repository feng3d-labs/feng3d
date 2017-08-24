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
     * Renders meshes inserted by the MeshFilter or TextMesh.
     */
    var MeshRenderer = (function (_super) {
        __extends(MeshRenderer, _super);
        /**
         * 构建
         */
        function MeshRenderer(gameObject) {
            return _super.call(this, gameObject) || this;
        }
        Object.defineProperty(MeshRenderer.prototype, "single", {
            get: function () { return true; },
            enumerable: true,
            configurable: true
        });
        MeshRenderer.prototype.drawRenderables = function (renderContext) {
            if (this.gameObject.visible) {
                var frustumPlanes = renderContext.camera.frustumPlanes;
                var gameObject = this.gameObject;
                var isIn = gameObject.transform.worldBounds.isInFrustum(frustumPlanes, 6);
                var model = gameObject.getComponent(MeshRenderer);
                if (gameObject.getComponent(feng3d.MeshFilter).mesh instanceof feng3d.SkyBoxGeometry) {
                    isIn = true;
                }
                if (isIn) {
                    _super.prototype.drawRenderables.call(this, renderContext);
                }
            }
        };
        return MeshRenderer;
    }(feng3d.Renderer));
    feng3d.MeshRenderer = MeshRenderer;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=MeshRenderer.js.map