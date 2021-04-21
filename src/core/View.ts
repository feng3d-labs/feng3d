interface HTMLCanvasElement
{
    gl: feng3d.GL;
}

namespace feng3d
{

    /**
     * 视图
     */
    export class View extends Feng3dObject
    {
        //
        canvas: HTMLCanvasElement;

        private _contextAttributes: WebGLContextAttributes = { stencil: true };

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
                    this._camera = serialization.setValue(new Entity(), { name: "defaultCamera" }).addComponent(Camera);
                    this.scene.node3d.addChild(this._camera.node3d);
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
        scene: Scene;
        /**
         * 根结点
         */
        get root()
        {
            return this.scene.node3d;
        }

        get gl()
        {
            if (!this.canvas.gl)
                this.canvas.gl = GL.getGL(this.canvas, this._contextAttributes);
            return this.canvas.gl;
        }

        /**
         * 鼠标在3D视图中的位置
         */
        get mousePos()
        {
            var clientRect = this.canvas.getBoundingClientRect();
            this._mousePos.x = windowEventProxy.clientX - clientRect.left;
            this._mousePos.y = windowEventProxy.clientY - clientRect.top;
            return this._mousePos;
        }
        private _mousePos = new Vector2();

        /**
         * 视窗区域
         */
        get viewRect()
        {
            var clientRect = this.canvas.getBoundingClientRect();
            this._viewRect.x = clientRect.left;
            this._viewRect.y = clientRect.top;
            this._viewRect.width = clientRect.width;
            this._viewRect.height = clientRect.height
            return this._viewRect;
        }
        private _viewRect = new Rectangle();

        /**
		 * 获取鼠标射线（与鼠标重叠的摄像机射线）
		 */
        get mouseRay3D()
        {
            var gpuPos = this.screenToGpuPosition(this.mousePos);
            this._mouseRay3D = this.camera.getRay3D(gpuPos.x, gpuPos.y);
            return this._mouseRay3D;
        }
        private _mouseRay3D: Ray3;

        /**
         * 鼠标事件管理
         */
        mouse3DManager: Mouse3DManager;

        protected contextLost = false;

        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas?: HTMLCanvasElement, scene?: Scene, camera?: Camera, contextAttributes?: WebGLContextAttributes)
        {
            super();
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
            console.assert(canvas instanceof HTMLCanvasElement, `canvas参数必须为 HTMLCanvasElement 类型！`);

            this.canvas = canvas;
            if (contextAttributes)
            {
                Object.assign(this._contextAttributes, contextAttributes);
            }

            canvas.addEventListener("webglcontextlost", (event) =>
            {
                event.preventDefault();
                this.contextLost = true;
                // #ifdef DEBUG
                console.log('GraphicsDevice: WebGL context lost.');
                // #endif
            }, false);

            canvas.addEventListener("webglcontextrestored", () =>
            {
                this.contextLost = false;
                // #ifdef DEBUG
                console.log('GraphicsDevice: WebGL context restored.');
                // #endif
            }, false);

            this.scene = scene || serialization.setValue(new Entity(), { name: "scene" }).addComponent(Scene);
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

        update(interval?: number)
        {
            this.render(interval);
            this.mouse3DManager.selectedTransform = this.selectedTransform;
        }

        /**
         * 绘制场景
         */
        render(interval?: number)
        {
            if (!this.scene) return;
            if (this.contextLost) return;

            this.scene.update(interval);

            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
            if (this.canvas.width * this.canvas.height == 0) return;

            this.camera.lens.aspect = this.viewRect.width / this.viewRect.height;

            this.scene.mouseRay3D = this.mouseRay3D;

            // 默认渲染
            this.gl.colorMask(true, true, true, true);
            this.gl.clearColor(this.scene.background.r, this.scene.background.g, this.scene.background.b, this.scene.background.a);
            this.gl.clearStencil(0);
            this.gl.clearDepth(1);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT);
            this.gl.enable(this.gl.DEPTH_TEST);

            // 鼠标拾取渲染
            this.selectedTransform = this.mouse3DManager.pick(this, this.scene, this.camera);
            //绘制阴影图
            shadowRenderer.draw(this.gl, this.scene, this.camera);
            skyboxRenderer.draw(this.gl, this.scene, this.camera);
            // 默认渲染
            forwardRenderer.draw(this.gl, this.scene, this.camera);
            outlineRenderer.draw(this.gl, this.scene, this.camera);
            wireframeRenderer.draw(this.gl, this.scene, this.camera);
        }

        /**
		 * 屏幕坐标转GPU坐标
		 * @param screenPos 屏幕坐标 (x: [0-width], y: [0 - height])
		 * @return GPU坐标 (x: [-1, 1], y: [-1, 1])
		 */
        screenToGpuPosition(screenPos: Vector2): Vector2
        {
            var gpuPos: Vector2 = new Vector2();
            gpuPos.x = (screenPos.x * 2 - this.viewRect.width) / this.viewRect.width;
            // 屏幕坐标与gpu中使用的坐标Y轴方向相反
            gpuPos.y = - (screenPos.y * 2 - this.viewRect.height) / this.viewRect.height;
            return gpuPos;
        }

		/**
		 * 投影坐标（世界坐标转换为3D视图坐标）
		 * @param point3d 世界坐标
		 * @return 屏幕的绝对坐标
		 */
        project(point3d: Vector3): Vector3
        {
            var v: Vector3 = this.camera.project(point3d);
            v.x = (v.x + 1.0) * this.viewRect.width / 2.0;
            v.y = (1.0 - v.y) * this.viewRect.height / 2.0;
            return v;
        }

        /**
		 * 屏幕坐标投影到场景坐标
		 * @param nX 屏幕坐标X ([0-width])
		 * @param nY 屏幕坐标Y ([0-height])
		 * @param sZ 到屏幕的距离
		 * @param v 场景坐标（输出）
		 * @return 场景坐标
		 */
        unproject(sX: number, sY: number, sZ: number, v = new Vector3()): Vector3
        {
            var gpuPos: Vector2 = this.screenToGpuPosition(new Vector2(sX, sY));
            return this.camera.unproject(gpuPos.x, gpuPos.y, sZ, v);
        }

        /**
         * 获取单位像素在指定深度映射的大小
         * @param   depth   深度
         */
        getScaleByDepth(depth: number, dir = new Vector2(0, 1))
        {
            var scale = this.camera.getScaleByDepth(depth, dir);
            scale = scale / new Vector2(this.viewRect.width * dir.x, this.viewRect.height * dir.y).length;
            return scale;
        }

        /**
         * 获取屏幕区域内所有实体
         * @param start 起点
         * @param end 终点
         */
        getObjectsInGlobalArea(start: Vector2, end: Vector2)
        {
            var s = this.viewRect.clampPoint(start);
            var e = this.viewRect.clampPoint(end);
            s.sub(this.viewRect.topLeft);
            e.sub(this.viewRect.topLeft);
            var min = s.clone().min(e);
            var max = s.clone().max(e);
            var rect = new Rectangle(min.x, min.y, max.x - min.x, max.y - min.y);
            //
            var transforms = this.scene.getComponentsInChildren(Node3D).filter(t =>
            {
                if (t == this.scene.node3d) return false;
                var m = t.getComponent(Renderable);
                if (m)
                {
                    var include = m.selfWorldBounds.toPoints().every(pos =>
                    {
                        var p = this.project(pos);
                        return rect.contains(p.x, p.y);
                    })
                    return include;
                }
                var p = this.project(t.worldPosition);
                return rect.contains(p.x, p.y);
            });
            return transforms;
        }

        protected selectedTransform: Node3D;

        static createNewScene()
        {
            var scene = serialization.setValue(new Entity(), { name: "Untitled" }).addComponent(Scene)
            scene.background.setTo(0.2784, 0.2784, 0.2784);
            scene.ambientColor.setTo(0.4, 0.4, 0.4);

            var camera = Camera.create("Main Camera");
            camera.entity.addComponent(AudioListener);
            camera.node3d.x = 0;
            camera.node3d.y = 1;
            camera.node3d.z = -10;
            scene.node3d.addChild(camera.node3d);

            var directionalLight = DirectionalLight.create("DirectionalLight");
            directionalLight.shadowType = ShadowType.Hard_Shadows;
            directionalLight.node3d.rx = 50;
            directionalLight.node3d.ry = -30;
            directionalLight.node3d.y = 3;
            scene.node3d.addChild(directionalLight.node3d);

            return scene;
        }
    }

}