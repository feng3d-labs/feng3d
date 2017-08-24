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
     * 鼠标拾取渲染器
     * @author feng 2017-02-06
     */
    var MouseRenderer = (function (_super) {
        __extends(MouseRenderer, _super);
        function MouseRenderer() {
            var _this = _super.call(this) || this;
            _this._shaderName = "mouse";
            _this.objects = [null];
            return _this;
        }
        /**
         * 渲染
         */
        MouseRenderer.prototype.draw = function (renderContext) {
            this.objects.length = 1;
            var gl = renderContext.gl;
            //启动裁剪，只绘制一个像素
            gl.enable(feng3d.GL.SCISSOR_TEST);
            gl.scissor(0, 0, 1, 1);
            // super.draw(renderContext);
            gl.disable(feng3d.GL.SCISSOR_TEST);
            //读取鼠标拾取索引
            // this.frameBufferObject.readBuffer(gl, "objectID");
            var data = new Uint8Array(4);
            gl.readPixels(0, 0, 1, 1, feng3d.GL.RGBA, feng3d.GL.UNSIGNED_BYTE, data);
            var id = data[0] + data[1] * 255 + data[2] * 255 * 255 + data[3] * 255 * 255 * 255 - data[3]; //最后（- data[3]）表示很奇怪，不过data[3]一般情况下为0
            // console.log(`选中索引3D对象${id}`, data.toString());
            this.selectedObject3D = this.objects[id];
        };
        MouseRenderer.prototype.drawRenderables = function (renderContext, meshRenderer) {
            if (meshRenderer.gameObject.mouseEnabled) {
                var object = meshRenderer.gameObject;
                this.objects.push(object);
                object._renderData.addUniform(this.createUniformData("u_objectID", this.objects.length - 1));
                // super.drawRenderables(renderContext, meshRenderer);
            }
        };
        /**
         * 绘制3D对象
         */
        MouseRenderer.prototype.drawObject3D = function (gl, renderAtomic, shader) {
            if (shader === void 0) { shader = null; }
            var vertexCode = feng3d.ShaderLib.getShaderCode(this._shaderName + ".vertex");
            var fragmentCode = feng3d.ShaderLib.getShaderCode(this._shaderName + ".fragment");
            var shader = new feng3d.ShaderRenderData();
            shader.setShaderCode(this.createShaderCode({ vertexCode: vertexCode, fragmentCode: fragmentCode }));
            // super.drawObject3D(gl, renderAtomic, shader);
        };
        return MouseRenderer;
    }(feng3d.RenderDataHolder));
    feng3d.MouseRenderer = MouseRenderer;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=MouseRenderer.js.map