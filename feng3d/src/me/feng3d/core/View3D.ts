module me.feng3d {

    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    export class View3D {

        private gl: WebGLRenderingContext;

        private _camera: Object3D;

        private _scene: Scene3D;

        private renderer: Renderer;

        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas, scene: Scene3D = null, camera: Object3D = null) {

            assert(canvas instanceof HTMLCanvasElement, `canvas参数必须为 HTMLCanvasElement 类型！`);
            this.gl = canvas.getContext("experimental-webgl");
            this.gl || alert("Unable to initialize WebGL. Your browser may not support it.");

            this.scene = scene || new Scene3D();
            this._camera = camera || factory.createCamera();
            this.renderer = new Renderer(this.gl, this.scene, this._camera);

            setInterval(this.drawScene.bind(this), 15);
        }

        /** 3d场景 */
        public get scene(): Scene3D {
            return this._scene;
        }

        public set scene(value: Scene3D) {
            this._scene = value;
        }

        private drawScene() {

            this.renderer.render();
        }
    }
}