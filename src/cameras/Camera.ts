namespace feng3d
{
    export interface GameObjectEventMap
    {
        lensChanged;
    }

    export interface ComponentMap { Camera: Camera; }

	/**
	 * 摄像机
	 */
    export class Camera extends Component
    {
        __class__: "feng3d.Camera" = "feng3d.Camera";

        private _lens: LensBase;
        private _viewProjection: Matrix4x4 = new Matrix4x4();
        private _viewProjectionInvalid = true;
        private _frustum: Frustum;
        private _frustumInvalid = true;
        private _viewBox = new Box();
        private _viewBoxInvalid = true;
        private _viewRect: Rectangle = new Rectangle(0, 0, 1, 1);

        /**
         * 视窗矩形
         */
        get viewRect()
        {
            return this._viewRect;
        }
        set viewRect(value)
        {
            this._viewRect = value;
        }

        get single() { return true; }

		/**
		 * 创建一个摄像机
		 */
        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.lens = this.lens || new PerspectiveLens();

            this.on("scenetransformChanged", this.onScenetransformChanged, this);
            this._viewProjectionInvalid = true;
            this._frustumInvalid = true;

            this._frustum = new Frustum();
        }

		/**
		 * 处理镜头变化事件
		 */
        private onLensChanged(event: Event<any>)
        {
            this._viewProjectionInvalid = true;
            this._frustumInvalid = true;

            this.dispatch(<any>event.type, event.data);
        }

        /**
		 * 镜头
		 */
        @serialize
        @oav()
        get lens(): LensBase
        {
            return this._lens;
        }

        set lens(value: LensBase)
        {
            if (this._lens == value)
                return;

            if (!value)
                throw new Error("Lens cannot be null!");

            if (this._lens)
                this._lens.off("lensChanged", this.onLensChanged, this);

            this._lens = value;

            if (this._lens)
                this._lens.on("lensChanged", this.onLensChanged, this);

            this.dispatch("lensChanged", this);
        }

		/**
		 * 场景投影矩阵，世界空间转投影空间
		 */
        get viewProjection(): Matrix4x4
        {
            if (this._viewProjectionInvalid)
            {
                //场景空间转摄像机空间
                this._viewProjection.copyFrom(this.transform.worldToLocalMatrix);
                //+摄像机空间转投影空间 = 场景空间转投影空间
                this._viewProjection.append(this._lens.matrix);
                this._viewProjectionInvalid = false;
            }

            return this._viewProjection;
        }

        /**
         * 处理场景变换改变事件
         */
        protected onScenetransformChanged()
        {
            this._viewProjectionInvalid = true;
            this._frustumInvalid = true;
        }

        /**
		 * 获取鼠标射线（与鼠标重叠的摄像机射线）
		 */
        getMouseRay3D(): Ray3D
        {
            return this.getRay3D(windowEventProxy.clientX - this._viewRect.x, windowEventProxy.clientY - this._viewRect.y);
        }

        /**
		 * 获取与坐标重叠的射线
		 * @param x view3D上的X坐标
		 * @param y view3D上的X坐标
		 * @return
		 */
        getRay3D(x: number, y: number, ray3D = new Ray3D()): Ray3D
        {
            var gpuPos: Vector2 = this.screenToGpuPosition(new Vector2(x, y));
            return this.lens.unprojectRay(gpuPos.x, gpuPos.y, ray3D).applyMatri4x4(this.transform.localToWorldMatrix);
        }

		/**
		 * 投影坐标（世界坐标转换为3D视图坐标）
		 * @param point3d 世界坐标
		 * @return 屏幕的绝对坐标
		 */
        project(point3d: Vector3): Vector3
        {
            var v: Vector3 = this.lens.project(this.transform.worldToLocalMatrix.transformVector(point3d));

            // var w = this._viewRect.width;
            // var h = this._viewRect.height;
            // var mat = new Matrix(2 / w, 0, 0, -2 / h, -1, 1);
            // mat.invert();
            // var p = mat.transformPoint(new Vector2(v.x,v.y));

            v.x = (v.x + 1.0) * this._viewRect.width / 2.0;
            v.y = (1.0 - v.y) * this._viewRect.height / 2.0;


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
            return this.transform.localToWorldMatrix.transformVector(this.lens.unprojectWithDepth(gpuPos.x, gpuPos.y, sZ, v), v);
        }

        /**
		 * 屏幕坐标转GPU坐标
		 * @param screenPos 屏幕坐标 (x: [0-width], y: [0 - height])
		 * @return GPU坐标 (x: [-1, 1], y: [-1, 1])
		 */
        screenToGpuPosition(screenPos: Vector2): Vector2
        {
            var gpuPos: Vector2 = new Vector2();
            gpuPos.x = (screenPos.x * 2 - this._viewRect.width) / this._viewRect.width;
            // 屏幕坐标与gpu中使用的坐标Y轴方向相反
            gpuPos.y = - (screenPos.y * 2 - this._viewRect.height) / this._viewRect.height;

            // var w = this._viewRect.width;
            // var h = this._viewRect.height;
            // var mat = new Matrix(2 / w, 0, 0, -2 / h, -1, 1);
            // var p = mat.transformPoint(screenPos);

            return gpuPos;
        }

        /**
         * 获取单位像素在指定深度映射的大小
         * @param   depth   深度
         */
        getScaleByDepth(depth: number)
        {
            var centerX = this._viewRect.width / 2;
            var centerY = this._viewRect.height / 2;
            var lt = this.unproject(centerX - 0.5, centerY - 0.5, depth);
            var rb = this.unproject(centerX + 0.5, centerY + 0.5, depth);
            var scale = lt.subTo(rb).length;
            return scale;
        }

		/**
		 * 视锥体
		 */
        get frustum()
        {
            if (this._frustumInvalid)
            {
                this._frustum.fromMatrix3D(this.viewProjection);
                this._frustumInvalid = false;
            }
            return this._frustum;
        }

        /**
         * 可视包围盒
         */
        get viewBox()
        {
            if (this._viewBoxInvalid)
            {
                this.updateViewBox();
                this._viewBoxInvalid = false;
            }
            return this._viewBox;
        }

        /**
         * 更新可视区域顶点
         */
        private updateViewBox()
        {
            this._viewBox.copy(this.lens.viewBox);
            this._viewBox.applyMatrix3D(this.transform.localToWorldMatrix);
        }
    }
}