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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var feng3d;
(function (feng3d) {
    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    var Renderer = (function (_super) {
        __extends(Renderer, _super);
        function Renderer(gameObject) {
            return _super.call(this, gameObject) || this;
        }
        Object.defineProperty(Renderer.prototype, "material", {
            /**
             * 材质
             * Returns the first instantiated Material assigned to the renderer.
             */
            get: function () { return this._material; },
            set: function (value) {
                if (this._material == value)
                    return;
                if (this._material)
                    this.removeRenderDataHolder(this._material);
                this._material = value;
                if (this._material)
                    this.addRenderDataHolder(this.material);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Renderer.prototype, "enabled", {
            /**
             * Makes the rendered 3D object visible if enabled.
             */
            get: function () {
                return this._enabled;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Renderer.prototype, "enable", {
            set: function (value) {
                this._enabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Renderer.prototype.drawRenderables = function (renderContext) {
            var object3D = this.gameObject;
            //更新数据
            object3D.updateRender(renderContext);
            var gl = renderContext.gl;
            // try
            // {
            //绘制
            var material = this.material;
            if (material.enableBlend) {
                //
                gl.enable(feng3d.GL.BLEND);
                gl.blendEquation(material.blendEquation);
                gl.depthMask(false);
                gl.blendFunc(material.sfactor, material.dfactor);
            }
            else {
                gl.disable(feng3d.GL.BLEND);
                gl.depthMask(true);
            }
            this.drawObject3D(gl, object3D._renderData); //
            // } catch (error)
            // {
            //     console.log(error);
            // }
        };
        /**
         * 绘制3D对象
         */
        Renderer.prototype.drawObject3D = function (gl, renderAtomic, shader) {
            if (shader === void 0) { shader = null; }
            shader = shader || renderAtomic.shader;
            var shaderProgram = shader.activeShaderProgram(gl);
            if (!shaderProgram)
                return;
            //
            renderAtomic.activeAttributes(gl, shaderProgram.attributes);
            renderAtomic.activeUniforms(gl, shaderProgram.uniforms);
            renderAtomic.dodraw(gl);
        };
        /**
         * 销毁
         */
        Renderer.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.material = null;
        };
        return Renderer;
    }(feng3d.Component));
    __decorate([
        feng3d.serialize
    ], Renderer.prototype, "material", null);
    __decorate([
        feng3d.serialize
    ], Renderer.prototype, "enabled", null);
    feng3d.Renderer = Renderer;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Renderer.js.map