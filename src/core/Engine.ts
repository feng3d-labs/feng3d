module feng3d
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
        /**
         * 根节点
         */
        root: GameObject;

        get canvas()
        {
            return this.gl.canvas;
        }

        /**
         * 渲染环境
         */
        private renderContext: RenderContext;

        /**
         * 鼠标在3D视图中的位置
         */
        get mousePos()
        {
            return new Point(input.clientX - this.gl.canvas.clientLeft, input.clientY - this.gl.canvas.clientTop);
        }

        get mouseinview()
        {
            return this.viewRect.contains(input.clientX, input.clientY);
        }

        viewRect: Rectangle;

        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas?: HTMLCanvasElement, scene?: Scene3D, camera?: Camera)
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

            this.gl = getGL(canvas);

            this.scene = scene || GameObject.create("scene").addComponent(Scene3D);
            this.camera = camera || GameObject.create("camera").addComponent(Camera);
            this.root = this.scene.gameObject;

            this.start();

            this.renderContext = new RenderContext();
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
            this.scene.update();

            this.gl.canvas.width = this.gl.canvas.clientWidth;
            this.gl.canvas.height = this.gl.canvas.clientHeight;

            this.renderContext.camera = this.camera;
            this.renderContext.scene3d = this.scene;
            this.renderContext.gl = this.gl;

            var clientRect = this.gl.canvas.getBoundingClientRect();
            this.viewRect = new Rectangle(clientRect.left, clientRect.top, clientRect.width, clientRect.height);
            this.camera.viewRect = this.viewRect;
            this.camera.lens.aspectRatio = this.viewRect.width / this.viewRect.height;

            //鼠标拾取渲染
            mouse3DManager.draw(this.scene, this.camera, this.viewRect);

            //绘制阴影图
            // this.shadowRenderer.draw(this._gl, this._scene, this._camera.camera);

            init(this.renderContext.gl, this.renderContext.scene3d, this.viewRect);

            skyboxRenderer.draw(this.renderContext, this.viewRect);

            // 默认渲染
            var forwardresult = forwardRenderer.draw(this.renderContext, this.viewRect);

            outlineRenderer.draw(this.renderContext, this.viewRect, forwardresult.unblenditems);

            wireframeRenderer.draw(this.renderContext, this.viewRect, forwardresult.unblenditems);
        }

    }

    function init(gl: GL, scene3D: Scene3D, viewRect: Rectangle)
    {
        // 默认渲染
        gl.clearColor(scene3D.background.r, scene3D.background.g, scene3D.background.b, scene3D.background.a);
        gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, viewRect.width, viewRect.height);
        gl.enable(GL.DEPTH_TEST);
    }
}