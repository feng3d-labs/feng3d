module feng3d {

    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    export class View3D {

        private _context3D: WebGL2RenderingContext;
        private _camera: Camera3D;
        private _scene: Scene3D;
        private _canvas: HTMLCanvasElement;

        /**
         * 绘制宽度
         */
        private renderWidth: number;
        /**
         * 绘制高度
         */
        private renderHeight: number;

        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas, scene: Scene3D = null, camera: Camera3D = null) {

            assert(canvas instanceof HTMLCanvasElement, `canvas参数必须为 HTMLCanvasElement 类型！`);
            this._canvas = canvas;

            this._context3D = this._canvas.getContext("webgl2");
            if (this._context3D == null) {

                alert("浏览器不支持 WebGL2!");
                window.location.href = "https://wardenfeng.github.io/#!blogs/2017/01/10/1.md";
                return;
            }

            this.initGL();

            this.scene = scene || new Scene3D();
            this.camera = camera || new Camera3D();

            setInterval(this.drawScene.bind(this), 15);
        }

        /**
         * 初始化GL
         */
        private initGL() {

            this._context3D.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
            this._context3D.clearDepth(1.0);                 // Clear everything
            this._context3D.enable(this._context3D.DEPTH_TEST);           // Enable depth testing
            this._context3D.depthFunc(this._context3D.LEQUAL);            // Near things obscure far things
        }

        /** 3d场景 */
        public get scene(): Scene3D {
            return this._scene;
        }

        public set scene(value: Scene3D) {
            this._scene = value;
        }

        /**
         * 绘制场景
         */
        private drawScene() {

            this.resize();
            this._scene.draw(this._context3D, this._camera);
        }

        /**
         * 重置尺寸
         */
        private resize() {

            if (this.renderWidth != this._canvas.width || this.renderHeight != this._canvas.height) {

                this.renderWidth = this._canvas.width;
                this.renderHeight = this._canvas.height;
                this._context3D.viewport(0, 0, this.renderWidth, this.renderHeight);
            }
        }

        /**
         * 摄像机
         */
        public get camera(): Camera3D {
            return this._camera;
        }

        public set camera(value: Camera3D) {

            this._camera = value;
        }
    }
}