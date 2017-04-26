module feng3d
{
	/**
	 * 摄像机
	 * @author feng 2016-08-16
	 */
    export abstract class Camera extends Object3DComponent
    {
        protected _projection: Matrix3D;
        public scissorRect: Rectangle = new Rectangle();
        public viewPort: Rectangle = new Rectangle();
        /**
		 * 最近距离
		 */
        public near: number = 0.1;
        /**
         * 最远距离
         */
        public far: number = 10000;
		/**
		 * 视窗缩放比例(width/height)，在渲染器中设置
		 */
        public aspectRatio: number = 1;

        protected _projectionInvalid: boolean = true;
        private _unprojection: Matrix3D;
        private _unprojectionInvalid: boolean = true;

        private _viewProjection: Matrix3D = new Matrix3D();
        private _viewProjectionInvalid: boolean = true;

		/**
		 * 创建一个摄像机
		 * @param lens 摄像机镜头
		 */
        constructor()
        {
            super();
            this._single = true;
            this._projection = new Matrix3D();

            Watcher.watch(this, ["near"], this.invalidateMatrix, this);
            Watcher.watch(this, ["far"], this.invalidateMatrix, this);
            Watcher.watch(this, ["aspectRatio"], this.invalidateMatrix, this);
        }

		/**
		 * 投影矩阵
		 */
        public get projection(): Matrix3D
        {
            if (this._projectionInvalid)
            {
                this.updateMatrix();
                this._projectionInvalid = false;
            }
            return this._projection;
        }

        public set projection(value: Matrix3D)
        {
            this._projection = value;
            this.invalidateMatrix();
        }

		/**
		 * 投影逆矩阵
		 */
        public get unprojectionMatrix(): Matrix3D
        {
            if (this._unprojectionInvalid)
            {
                if (this._unprojection == null)
                    this._unprojection = new Matrix3D();
                this._unprojection.copyFrom(this.projection);
                this._unprojection.invert();
                this._unprojectionInvalid = false;
            }

            return this._unprojection;
        }

		/**
		 * 投影矩阵失效
		 */
        protected invalidateMatrix()
        {
            this._projectionInvalid = true;
            this._unprojectionInvalid = true;
            this._viewProjectionInvalid = true;
        }

        /**
		 * 场景投影矩阵，世界空间转投影空间
		 */
        public get viewProjection(): Matrix3D
        {
            if (this._viewProjectionInvalid)
            {
                //场景空间转摄像机空间
                this._viewProjection.copyFrom(this.inverseGlobalMatrix3D);
                //+摄像机空间转投影空间 = 场景空间转投影空间
                this._viewProjection.append(this.projection);
                this._viewProjectionInvalid = false;
            }

            return this._viewProjection;
        }

        public get inverseGlobalMatrix3D()
        {
            return this.parentComponent ? this.parentComponent.inverseSceneTransform : new Matrix3D();
        }

        public get globalMatrix3D()
        {
            return this.parentComponent ? this.parentComponent.sceneTransform : new Matrix3D();
        }

		/**
		 * 更新投影矩阵
		 */
        protected abstract updateMatrix();

        /**
		 * 屏幕坐标投影到场景坐标
		 * @param nX 屏幕坐标X -1（左） -> 1（右）
		 * @param nY 屏幕坐标Y -1（上） -> 1（下）
		 * @param sZ 到屏幕的距离
		 * @param v 场景坐标（输出）
		 * @return 场景坐标
		 */
        abstract unproject(nX: number, nY: number, sZ: number, v: Vector3D): Vector3D;

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void
        {
            this.parentComponent.addEventListener(Object3DEvent.SCENETRANSFORM_CHANGED, this.onSpaceTransformChanged, this);
        }

        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void
        {
            this.parentComponent.removeEventListener(Object3DEvent.SCENETRANSFORM_CHANGED, this.onSpaceTransformChanged, this);
        }

        private onSpaceTransformChanged(event: Object3DEvent): void
        {
            this._viewProjectionInvalid = true;
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            //
            renderData.uniforms[RenderDataID.u_viewProjection] = this.viewProjection;
            var globalMatrix3d = this.parentComponent ? this.parentComponent.sceneTransform : new Matrix3D();
            renderData.uniforms[RenderDataID.u_cameraMatrix] = globalMatrix3d;
            //
            renderData.uniforms[RenderDataID.u_skyBoxSize] = this.far / Math.sqrt(3);
            super.updateRenderData(renderContext, renderData);
        }
    }
}