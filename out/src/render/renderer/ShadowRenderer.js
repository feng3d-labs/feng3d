var feng3d;
(function (feng3d) {
    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    var ShadowRenderer = (function () {
        // private frameBufferObject: FrameBufferObject;
        function ShadowRenderer() {
        }
        /**
         * 渲染
         */
        ShadowRenderer.prototype.draw = function (renderContext) {
            var gl = renderContext.gl;
            var lights = feng3d.Light.lights;
            for (var i = 0; i < lights.length; i++) {
                var light = lights[i];
                // var frameBufferObject = new FrameBufferObject();
                // frameBufferObject.init(gl);
                // frameBufferObject.active(gl);
                // MeshRenderer.meshRenderers.forEach(element =>
                // {
                // this.drawRenderables(renderContext, element);
                // });
                // frameBufferObject.deactive(gl);
            }
        };
        return ShadowRenderer;
    }());
    feng3d.ShadowRenderer = ShadowRenderer;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=ShadowRenderer.js.map