module feng3d {

    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    export class View3D {

        private context3D: WebGLRenderingContext;
        private _camera: Camera3D;
        private _scene: Scene3D;
        private renderer: Renderer;
        private canvas: HTMLCanvasElement;

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
            this.canvas = canvas;

            this.context3D = this.canvas.getContext("experimental-webgl");
            this.context3D || alert("Unable to initialize WebGL. Your browser may not support it.");
            this.initGL();

            this.scene = scene || new Scene3D();
            this.camera = camera || new Camera3D();
            this.renderer = new Renderer();

            setInterval(this.drawScene.bind(this), 15);
        }

        /**
         * 初始化GL
         */
        private initGL() {

            this.context3D.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
            this.context3D.clearDepth(1.0);                 // Clear everything
            this.context3D.enable(this.context3D.DEPTH_TEST);           // Enable depth testing
            this.context3D.depthFunc(this.context3D.LEQUAL);            // Near things obscure far things
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
            this.renderer.render(this.context3D, this._scene, this._camera);
        }

        /**
         * 重置尺寸
         */
        private resize() {

            if (this.renderWidth != this.canvas.width || this.renderHeight != this.canvas.height) {

                this.renderWidth = this.canvas.width;
                this.renderHeight = this.canvas.height;
                this.context3D.viewport(0, 0, this.renderWidth, this.renderHeight);
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