namespace feng3d
{
    /**
	 * @author feng 2014-10-14
	 */
    export interface CameraEventMap
    {
        lensChanged;
    }

    export interface Camera
    {
        once<K extends keyof CameraEventMap>(type: K, listener: (event: Event<CameraEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof CameraEventMap>(type: K, data?: CameraEventMap[K], bubbles?: boolean);
        has<K extends keyof CameraEventMap>(type: K): boolean;
        on<K extends keyof CameraEventMap>(type: K, listener: (event: Event<CameraEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof CameraEventMap>(type?: K, listener?: (event: Event<CameraEventMap[K]>) => any, thisObject?: any);
    }

	/**
	 * 摄像机
	 * @author feng 2016-08-16
	 */
    export class Camera extends Component
    {
        private _lens: LensBase;
        private _viewProjection: Matrix4x4 = new Matrix4x4();
        private _viewProjectionDirty = true;
        private _frustum: Frustum;
        private _frustumDirty = true;
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

            this.gameObject.on("scenetransformChanged", this.onScenetransformChanged, this);
            this._viewProjectionDirty = true;
            this._frustumDirty = true;

            this._frustum = new Frustum();
        }

		/**
		 * 处理镜头变化事件
		 */
        private onLensMatrixChanged(event: Event<any>)
        {
            this._viewProjectionDirty = true;
            this._frustumDirty = true;

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
                this._lens.off("matrixChanged", this.onLensMatrixChanged, this);

            this._lens = value;

            if (this._lens)
                this._lens.on("matrixChanged", this.onLensMatrixChanged, this);

            this.dispatch("lensChanged", this);
        }

		/**
		 * 场景投影矩阵，世界空间转投影空间
		 */
        get viewProjection(): Matrix4x4
        {
            if (this._viewProjectionDirty)
            {
                //场景空间转摄像机空间
                this._viewProjection.copyFrom(this.transform.worldToLocalMatrix);
                //+摄像机空间转投影空间 = 场景空间转投影空间
                this._viewProjection.append(this._lens.matrix);
                this._viewProjectionDirty = false;
            }

            return this._viewProjection;
        }

        /**
         * 处理场景变换改变事件
         */
        protected onScenetransformChanged()
        {
            this._viewProjectionDirty = true;
            this._frustumDirty = true;
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
        getRay3D(x: number, y: number, ray3D?: Ray3D): Ray3D
        {
            //摄像机坐标
            var rayPosition: Vector3 = this.unproject(x, y, 0);
            //摄像机前方1处坐标
            var rayDirection: Vector3 = this.unproject(x, y, 1);
            //射线方向
            rayDirection.x = rayDirection.x - rayPosition.x;
            rayDirection.y = rayDirection.y - rayPosition.y;
            rayDirection.z = rayDirection.z - rayPosition.z;
            rayDirection.normalize();
            //定义射线
            ray3D = ray3D || new Ray3D(rayPosition, rayDirection);
            return ray3D;
        }

		/**
		 * 投影坐标（世界坐标转换为3D视图坐标）
		 * @param point3d 世界坐标
		 * @return 屏幕的绝对坐标
		 */
        project(point3d: Vector3): Vector3
        {
            var v: Vector3 = this.lens.project(this.transform.worldToLocalMatrix.transformVector(point3d));

            v.x = (v.x + 1.0) * this._viewRect.width / 2.0;
            v.y = (v.y + 1.0) * this._viewRect.height / 2.0;

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
        unproject(sX: number, sY: number, sZ: number, v?: Vector3): Vector3
        {
            var gpuPos: Vector2 = this.screenToGpuPosition(new Vector2(sX, sY));
            return this.transform.localToWorldMatrix.transformVector(this.lens.unproject(gpuPos.x, gpuPos.y, sZ, v), v);
        }

        /**
		 * 屏幕坐标转GPU坐标
		 * @param screenPos 屏幕坐标 (x:[0-width],y:[0-height])
		 * @return GPU坐标 (x:[-1,1],y:[-1-1])
		 */
        screenToGpuPosition(screenPos: Vector2): Vector2
        {
            var gpuPos: Vector2 = new Vector2();
            gpuPos.x = (screenPos.x * 2 - this._viewRect.width) / this._viewRect.width;
            gpuPos.y = (screenPos.y * 2 - this._viewRect.height) / this._viewRect.height;
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
            if (this._frustumDirty)
                this._frustum.fromMatrix3D(this.viewProjection);
            return this._frustum;
        }

        preRender(renderAtomic: RenderAtomic)
        {
            //
            renderAtomic.uniforms.u_projectionMatrix = () => this._lens.matrix;

            renderAtomic.uniforms.u_viewProjection = () => this.viewProjection;
            renderAtomic.uniforms.u_viewMatrix = () => this.transform.worldToLocalMatrix;
            renderAtomic.uniforms.u_cameraMatrix = () => this.transform.localToWorldMatrix;
            renderAtomic.uniforms.u_skyBoxSize = () => { return this._lens.far / Math.sqrt(3); };
            renderAtomic.uniforms.u_scaleByDepth = this.getScaleByDepth(1);
        }
    }
}