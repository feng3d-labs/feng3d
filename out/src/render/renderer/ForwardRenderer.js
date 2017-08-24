var feng3d;
(function (feng3d) {
    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    var ForwardRenderer = (function () {
        function ForwardRenderer() {
        }
        /**
         * 渲染
         */
        ForwardRenderer.prototype.draw = function (renderContext, viewRect) {
            var gl = renderContext.gl;
            var scene3D = renderContext.scene3d;
            // 默认渲染
            gl.clearColor(scene3D.background.r, scene3D.background.g, scene3D.background.b, scene3D.background.a);
            gl.clear(feng3d.GL.COLOR_BUFFER_BIT | feng3d.GL.DEPTH_BUFFER_BIT);
            gl.viewport(0, 0, viewRect.width, viewRect.height);
            gl.enable(feng3d.GL.DEPTH_TEST);
            // gl.cullFace()
            var meshRenderers = scene3D.getComponentsInChildren(feng3d.MeshRenderer);
            for (var i = 0; i < meshRenderers.length; i++) {
                meshRenderers[i].drawRenderables(renderContext);
            }
        };
        return ForwardRenderer;
    }());
    feng3d.ForwardRenderer = ForwardRenderer;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=ForwardRenderer.js.map