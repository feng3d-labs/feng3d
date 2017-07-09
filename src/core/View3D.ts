namespace feng3d
{

    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    export class View3D
    {
		/**
		 * 射线坐标临时变量
		 */
        private static tempRayPosition: Vector3D = new Vector3D();
        /**
		 * 射线方向临时变量
		 */
        private static tempRayDirection: Vector3D = new Vector3D();

        //
        private _gl: GL;
        private _camera: Camera;
        private _scene: Scene3D;
        private _canvas: HTMLCanvasElement;
        private _viewRect: Rectangle;

        /**
         * 默认渲染器
         */
        private defaultRenderer: ForwardRenderer;

        /**
         * 鼠标事件管理器
         */
        private mouse3DManager: Mouse3DManager;

        /**
         * 阴影图渲染器
         */
        private shadowRenderer: ShadowRenderer;

        /**
         * 渲染环境
         */
        private _renderContext: RenderContext;

        /**
         * 鼠标在3D视图中的位置
         */
        public get mousePos()
        {
            return new Point(input.clientX - this._viewRect.x, input.clientY - this._viewRect.y);
        }

        /**
         * 是否自动渲染
         */
        public get autoRender()
        {
            return this._autoRender;
        }
        public set autoRender(value)
        {
            if (this._autoRender)
                Event.off(ticker, <any>"enterFrame", this.render, this);
            this._autoRender = value;
            if (this._autoRender)
                Event.on(ticker, <any>"enterFrame", this.render, this);
        }
        private _autoRender: boolean;

        public get viewRect()
        {
            return this._viewRect;
        }

        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas: HTMLCanvasElement = null, scene: Scene3D = null, camera: Camera = null, autoRender = true)
        {
            if (!canvas)
            {
                canvas = document.createElement("canvas");
                canvas.id = "glcanvas";
                canvas.style.width = "100%";
                canvas.style.height = "100%";
                document.body.appendChild(canvas);
            }

            debuger && console.assert(canvas instanceof HTMLCanvasElement, `canvas参数必须为 HTMLCanvasElement 类型！`);
            this._canvas = canvas;

            var glProxy = new GLProxy(canvas);
            this._gl = glProxy.gl;

            this.initGL();

            this._viewRect = new Rectangle(this._canvas.clientLeft, this._canvas.clientTop, this._canvas.clientWidth, this._canvas.clientHeight);
            this.scene = scene || GameObject.create("scene").addComponent(Scene3D);
            this.camera = camera || GameObject.create("camera").addComponent(Camera);
            this.autoRender = autoRender;

            this.defaultRenderer = new ForwardRenderer();
            this.mouse3DManager = new Mouse3DManager();
            this.shadowRenderer = new ShadowRenderer();

            this._renderContext = new RenderContext();
        }

        /**
         * 初始化GL
         */
        private initGL()
        {
            this._gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
            this._gl.clearDepth(1.0);                 // Clear everything
            this._gl.enable(GL.DEPTH_TEST);           // Enable depth testing
            this._gl.depthFunc(GL.LEQUAL);            // Near things obscure far things
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
         * 视窗宽度
         */
        public get width()
        {
            return this._canvas.width;
        }

        /**
         * 绘制场景
         */
        public render()
        {
            this._canvas.width = this._canvas.clientWidth;
            this._canvas.height = this._canvas.clientHeight;

            this._renderContext.camera = this._camera;
            this._renderContext.scene3d = this._scene;
            this._renderContext.view3D = this;
            this._renderContext.gl = this._gl;

            var viewClientRect: ClientRect = this._canvas.getBoundingClientRect();
            var viewRect = this._viewRect = this._viewRect || new Rectangle();
            viewRect.setTo(viewClientRect.left, viewClientRect.top, viewClientRect.width, viewClientRect.height);
            this.camera.viewRect = viewRect;
            this.camera.lens.aspectRatio = viewRect.width / viewRect.height;

            //鼠标拾取渲染
            this.mouse3DManager.viewRect.copyFrom(viewRect);
            this.mouse3DManager.draw(this._renderContext);

            //绘制阴影图
            // this.shadowRenderer.draw(this._gl, this._scene, this._camera.camera);

            // 默认渲染
            this.defaultRenderer.viewRect.copyFrom(viewRect);
            this.defaultRenderer.draw(this._renderContext);
        }

        /**
         * 摄像机
         */
        public get camera()
        {
            return this._camera;
        }

        public set camera(value)
        {
            this._camera = value;
        }
    }
}