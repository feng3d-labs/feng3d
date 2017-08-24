var feng3d;
(function (feng3d) {
    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    var Engine = (function () {
        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        function Engine(canvas, scene, camera) {
            if (canvas === void 0) { canvas = null; }
            if (scene === void 0) { scene = null; }
            if (camera === void 0) { camera = null; }
            if (!canvas) {
                canvas = document.createElement("canvas");
                canvas.id = "glcanvas";
                canvas.style.width = "100%";
                canvas.style.height = "100%";
                document.body.appendChild(canvas);
            }
            feng3d.debuger && console.assert(canvas instanceof HTMLCanvasElement, "canvas\u53C2\u6570\u5FC5\u987B\u4E3A HTMLCanvasElement \u7C7B\u578B\uFF01");
            this.canvas = canvas;
            this.gl = feng3d.getGL(canvas);
            this.scene = scene || feng3d.GameObject.create("scene").addComponent(feng3d.Scene3D);
            this.camera = camera || feng3d.GameObject.create("camera").addComponent(feng3d.Camera);
            this.start();
            this.defaultRenderer = new feng3d.ForwardRenderer();
            this.mouse3DManager = new feng3d.Mouse3DManager();
            this.shadowRenderer = new feng3d.ShadowRenderer();
            this.renderContext = new feng3d.RenderContext();
            engines[canvas.id] = this;
        }
        Object.defineProperty(Engine.prototype, "mousePos", {
            /**
             * 鼠标在3D视图中的位置
             */
            get: function () {
                return new feng3d.Point(feng3d.input.clientX - this.canvas.clientLeft, feng3d.input.clientY - this.canvas.clientTop);
            },
            enumerable: true,
            configurable: true
        });
        Engine.prototype.start = function () {
            feng3d.ticker.on("enterFrame", this.update, this);
        };
        Engine.prototype.stop = function () {
            feng3d.ticker.off("enterFrame", this.update, this);
        };
        Engine.prototype.update = function () {
            this.render();
        };
        /**
         * 绘制场景
         */
        Engine.prototype.render = function () {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
            this.renderContext.camera = this.camera;
            this.renderContext.scene3d = this.scene;
            this.renderContext.view3D = this;
            this.renderContext.gl = this.gl;
            var clientRect = this.canvas.getBoundingClientRect();
            this.viewRect = new feng3d.Rectangle(clientRect.left, clientRect.top, clientRect.width, clientRect.height);
            this.camera.viewRect = this.viewRect;
            this.camera.lens.aspectRatio = this.viewRect.width / this.viewRect.height;
            //鼠标拾取渲染
            this.mouse3DManager.draw(this.scene, this.camera, this.viewRect);
            //绘制阴影图
            // this.shadowRenderer.draw(this._gl, this._scene, this._camera.camera);
            // 默认渲染
            this.defaultRenderer.draw(this.renderContext, this.viewRect);
        };
        Engine.get = function (canvas) {
            if (canvas === void 0) { canvas = null; }
            if (canvas) {
                return engines[canvas.id];
            }
            return engines["feng3dcanvas"] || new Engine(canvas);
        };
        return Engine;
    }());
    feng3d.Engine = Engine;
    var engines = {};
})(feng3d || (feng3d = {}));
//# sourceMappingURL=View3D.js.map