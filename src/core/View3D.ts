module feng3d
{

    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    export class View3D
    {

        private _context3D: Context3D;
        private _camera: Camera3D;
        private _scene: Scene3D;
        private _canvas: HTMLCanvasElement;

        /**
         * 默认渲染器
         */
        private defaultRenderer: Renderer;

        /**
         * 鼠标事件管理器
         */
        private mouse3DManager: Mouse3DManager;

        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas, scene: Scene3D = null, camera: Camera3D = null)
        {

            assert(canvas instanceof HTMLCanvasElement, `canvas参数必须为 HTMLCanvasElement 类型！`);
            this._canvas = canvas;

            this._context3D = <Context3D>this._canvas.getContext(contextId, { antialias: false });
            this._context3D.getContextAttributes();

            this.initGL();

            this.scene = scene || new Scene3D();
            this.camera = camera || new Camera3D();

            this.defaultRenderer = new Renderer();
            this.mouse3DManager = new Mouse3DManager();

            setInterval(this.drawScene.bind(this), 15);
        }

        /**
         * 初始化GL
         */
        private initGL()
        {

            this._context3D.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
            this._context3D.clearDepth(1.0);                 // Clear everything
            this._context3D.enable(Context3D.DEPTH_TEST);           // Enable depth testing
            this._context3D.depthFunc(Context3D.LEQUAL);            // Near things obscure far things
        }

        /** 3d场景 */
        public get scene(): Scene3D
        {
            return this._scene;
        }

        public set scene(value: Scene3D)
        {
            this._scene = value;
        }

        /**
         * 绘制场景
         */
        private drawScene()
        {

            //鼠标拾取渲染
            this.mouse3DManager.viewRect.setTo(this._canvas.offsetLeft, this._canvas.offsetTop, this._canvas.width, this._canvas.height)
            this.mouse3DManager.draw(this._context3D, this._scene, this._camera);

            // 默认渲染
            this._context3D.clearColor(0, 0, 0, 1.0);
            this._context3D.clear(Context3D.COLOR_BUFFER_BIT | Context3D.DEPTH_BUFFER_BIT);
            this._context3D.viewport(0, 0, this._canvas.width, this._canvas.height);
            this.defaultRenderer.draw(this._context3D, this._scene, this._camera);
        }

        /**
         * 摄像机
         */
        public get camera(): Camera3D
        {
            return this._camera;
        }

        public set camera(value: Camera3D)
        {

            this._camera = value;
        }
    }
}