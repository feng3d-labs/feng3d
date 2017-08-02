namespace feng3d
{

    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    export class Engine
    {
        //
        gl: GL;
        /**
         * 摄像机
         */
        camera: Camera;
        /**
         * 3d场景
         */
        scene: Scene3D;
        canvas: HTMLCanvasElement;

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
        private renderContext: RenderContext;

        /**
         * 鼠标在3D视图中的位置
         */
        public get mousePos()
        {
            return new Point(input.clientX - this.canvas.clientLeft, input.clientY - this.canvas.clientTop);
        }

        viewRect: Rectangle;

        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas: HTMLCanvasElement = null, scene: Scene3D = null, camera: Camera = null)
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
            this.canvas = canvas;

            this.gl = getGL(canvas);

            this.scene = scene || GameObject.create("scene").addComponent(Scene3D);
            this.camera = camera || GameObject.create("camera").addComponent(Camera);

            this.start();

            this.defaultRenderer = new ForwardRenderer();
            this.mouse3DManager = new Mouse3DManager();
            this.shadowRenderer = new ShadowRenderer();

            this.renderContext = new RenderContext();

            engines[canvas.id] = this;
        }

        start()
        {
            ticker.on("enterFrame", this.update, this);
        }

        stop()
        {
            ticker.off("enterFrame", this.update, this);
        }

        update()
        {
            this.render();
        }

        /**
         * 绘制场景
         */
        render()
        {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;

            this.renderContext.camera = this.camera;
            this.renderContext.scene3d = this.scene;
            this.renderContext.view3D = this;
            this.renderContext.gl = this.gl;

            var clientRect = this.canvas.getBoundingClientRect();
            this.viewRect = new Rectangle(clientRect.left, clientRect.top, clientRect.width, clientRect.height);
            this.camera.viewRect = this.viewRect;
            this.camera.lens.aspectRatio = this.viewRect.width / this.viewRect.height;

            //鼠标拾取渲染
            this.mouse3DManager.draw(this.renderContext, this.viewRect);

            //绘制阴影图
            // this.shadowRenderer.draw(this._gl, this._scene, this._camera.camera);

            // 默认渲染
            this.defaultRenderer.draw(this.renderContext, this.viewRect);
        }

        static get(canvas: HTMLCanvasElement = null)
        {
            if (canvas)
            {
                return engines[canvas.id];
            }
            return engines["feng3dcanvas"] || new Engine(canvas);
        }
    }
    var engines: { [id: string]: Engine } = {};
}