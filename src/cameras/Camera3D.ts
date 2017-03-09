module feng3d
{
	/**
	 * 摄像机
	 * @author feng 2016-08-16
	 */
    export class Camera3D extends Object3DComponent
    {
        private _viewProjection: Matrix3D = new Matrix3D();
        private _viewProjectionDirty: Boolean = true;
        private _lens: LensBase;

		/**
		 * 创建一个摄像机
		 * @param lens 摄像机镜头
		 */
        constructor(lens: LensBase = null)
        {
            super();
            this._lens = lens || new PerspectiveLens();
            this._lens.addEventListener(LensEvent.MATRIX_CHANGED, this.onLensMatrixChanged, this);
        }

        /**
         * 镜头
         */
        public get lens()
        {
            return this._lens;
        }

        /**
		 * 场景投影矩阵，世界空间转投影空间
		 */
        public get viewProjection(): Matrix3D
        {
            if (this._viewProjectionDirty)
            {
                //场景空间转摄像机空间
                this._viewProjection.copyFrom(this.inverseSceneTransform);
                //+摄像机空间转投影空间 = 场景空间转投影空间
                this._viewProjection.append(this._lens.matrix);
                this._viewProjectionDirty = false;
            }

            return this._viewProjection;
        }

        public get inverseSceneTransform()
        {
            return this.parentComponent ? this.parentComponent.transform.inverseGlobalMatrix3D : new Matrix3D();
        }

        public get globalMatrix3D()
        {
            return this.parentComponent ? this.parentComponent.transform.globalMatrix3D : new Matrix3D();
        }

        /**
		 * 屏幕坐标投影到场景坐标
		 * @param nX 屏幕坐标X -1（左） -> 1（右）
		 * @param nY 屏幕坐标Y -1（上） -> 1（下）
		 * @param sZ 到屏幕的距离
		 * @param v 场景坐标（输出）
		 * @return 场景坐标
		 */
        public unproject(nX: number, nY: number, sZ: number, v: Vector3D = null): Vector3D
        {
            return this.globalMatrix3D.transformVector(this.lens.unproject(nX, nY, sZ, v), v);
        }

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void
        {
            this.parentComponent.addEventListener(TransformEvent.SCENETRANSFORM_CHANGED, this.onSpaceTransformChanged, this);
        }

        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void
        {
            this.parentComponent.removeEventListener(TransformEvent.SCENETRANSFORM_CHANGED, this.onSpaceTransformChanged, this);
        }

        /**
		 * 处理镜头变化事件
		 */
        private onLensMatrixChanged(event: LensEvent): void
        {
            this._viewProjectionDirty = true;
            this.dispatchEvent(event);
        }

        private onSpaceTransformChanged(event: TransformEvent): void
        {
            this._viewProjectionDirty = true;
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext)
        {
            super.updateRenderData(renderContext);
            //
            this._renderData.uniforms[RenderDataID.u_viewProjection] = this.viewProjection;
            var globalMatrix3d = this.parentComponent ? this.parentComponent.transform.globalMatrix3D : new Matrix3D();
            this._renderData.uniforms[RenderDataID.u_cameraMatrix] = globalMatrix3d;
        }
    }
}