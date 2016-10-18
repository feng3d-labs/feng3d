module feng3d {

    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    export class View3D {

        private context3d: WebGLRenderingContext;

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

            this.context3d = this.canvas.getContext("experimental-webgl");
            this.context3d || alert("Unable to initialize WebGL. Your browser may not support it.");

            this.scene = scene || new Scene3D();
            this.camera = camera || new Camera3D();
            this.renderer = new Renderer(this.context3d, this.scene, this._camera);

            setInterval(this.drawScene.bind(this), 15);
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
            this.renderer.render();
        }

        /**
         * 重置尺寸
         */
        private resize() {

            if (this.renderWidth != this.canvas.width || this.renderHeight != this.canvas.height) {

                this.renderWidth = this.canvas.width;
                this.renderHeight = this.canvas.height;
                this.context3d.viewport(0, 0, this.renderWidth, this.renderHeight);
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