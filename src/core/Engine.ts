interface HTMLCanvasElement
{
    gl: feng3d.GL;
}

namespace feng3d
{

    /**
     * 3D视图

     */
    export class Engine
    {
        //
        canvas: HTMLCanvasElement;
        /**
         * 摄像机
         */
        get camera()
        {
            if (!this._camera)
            {
                var cameras = this.scene.getComponentsInChildren(Camera);
                if (cameras.length == 0)
                {
                    this._camera = GameObject.create("defaultCamera").addComponent(Camera);
                    this.scene.gameObject.addChild(this._camera.gameObject);
                } else
                {
                    this._camera = cameras[0];
                }
            }
            return this._camera;
        }
        set camera(v)
        {
            this._camera = v;
        }
        private _camera: Camera;
        /**
         * 3d场景
         */
        scene: Scene3D;
        /**
         * 根节点
         */
        get root()
        {
            return this.scene.gameObject;
        }

        get gl()
        {
            if (!this.canvas.gl)
                this.canvas.gl = GL.getGL(this.canvas);
            return this.canvas.gl;
        }

        /**
         * 鼠标事件管理
         */
        mouse3DManager: Mouse3DManager;
        protected selectedObject: GameObject;

        /**
         * 鼠标在3D视图中的位置
         */
        get mousePos()
        {
            return new Vector2(windowEventProxy.clientX - this.canvas.clientLeft, windowEventProxy.clientY - this.canvas.clientTop);
        }

        get mouseinview()
        {
            return this.viewRect.contains(windowEventProxy.clientX, windowEventProxy.clientY);
        }

        get viewRect()
        {
            var clientRect = this.canvas.getBoundingClientRect();
            var viewRect = new Rectangle(clientRect.left, clientRect.top, clientRect.width, clientRect.height);
            return viewRect;
        }

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
                canvas.style.position = "fixed";
                canvas.style.left = "0px";
                canvas.style.top = "0px";
                canvas.style.width = "100%";
                canvas.style.height = "100%";
                document.body.appendChild(canvas);
            }
            debuger && assert(canvas instanceof HTMLCanvasElement, `canvas参数必须为 HTMLCanvasElement 类型！`);

            this.canvas = canvas;

            this.scene = scene || GameObject.create("scene").addComponent(Scene3D);
            this.camera = camera;

            this.start();

            this.mouse3DManager = new Mouse3DManager(new WindowMouseInput(), () => this.viewRect);
        }

        /**
         * 修改canvas尺寸
         * @param width 宽度
         * @param height 高度
         */
        setSize(width: number, height: number)
        {
            this.canvas.width = width;
            this.canvas.height = height;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
        }

        start()
        {
            ticker.onframe(this.update, this);
        }

        stop()
        {
            ticker.offframe(this.update, this);
        }

        update()
        {
            this.render();
            this.mouse3DManager.selectedGameObject = this.selectedObject;
        }

        /**
         * 绘制场景
         */
        render()
        {
            if (!this.scene)
                return;
            this.scene.update();

            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;

            var viewRect = this.viewRect;

            this.camera.viewRect = viewRect;
            this.camera.lens.aspect = viewRect.width / viewRect.height;

            // 默认渲染
            this.gl.clearColor(this.scene.background.r, this.scene.background.g, this.scene.background.b, this.scene.background.a);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            this.gl.enable(this.gl.DEPTH_TEST);

            //鼠标拾取渲染
            this.selectedObject = this.mouse3DManager.pick(this.scene, this.camera);
            //绘制阴影图
            shadowRenderer.draw(this.gl, this.scene, this.camera);
            skyboxRenderer.draw(this.gl, this.scene, this.camera);
            // 默认渲染
            forwardRenderer.draw(this.gl, this.scene, this.camera);
            outlineRenderer.draw(this.gl, this.scene, this.camera);
            wireframeRenderer.draw(this.gl, this.scene, this.camera);
        }
    }
}

// var viewRect0 = { x: 0, y: 0, w: 400, h: 300 };