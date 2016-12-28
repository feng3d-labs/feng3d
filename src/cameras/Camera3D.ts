module feng3d {

	/**
	 * 摄像机
	 * @author feng 2016-08-16
	 */
    export class Camera3D extends Object3DComponent {

        private _viewProjection: Matrix3D = new Matrix3D();
        private _viewProjectionDirty: Boolean = true;
        private _lens: LensBase;

		/**
		 * 创建一个摄像机
		 * @param lens 摄像机镜头
		 */
        constructor(lens: LensBase = null) {
            super();
            this._lens = lens || new PerspectiveLens();
            this._lens.addEventListener(LensEvent.MATRIX_CHANGED, this.onLensMatrixChanged, this);
        }

        /**
         * 镜头
         */
        public get lens() {

            return this._lens;
        }

        /**
		 * 场景投影矩阵，世界空间转投影空间
		 */
        public get viewProjection(): Matrix3D {

            if (this._viewProjectionDirty) {
                var inverseSceneTransform = this.object3D ? this.object3D.transform.inverseGlobalMatrix3D : new Matrix3D();
                //场景空间转摄像机空间
                this._viewProjection.copyFrom(inverseSceneTransform);
                //+摄像机空间转投影空间 = 场景空间转投影空间
                this._viewProjection.append(this._lens.matrix);
                this._viewProjectionDirty = false;
            }

            return this._viewProjection;
        }

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void {

            this.object3D.addEventListener(TransfromEvent.TRANSFORM_CHANGED, this.onSpaceTransformChanged, this);
        }

        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void {

            this.object3D.removeEventListener(TransfromEvent.TRANSFORM_CHANGED, this.onSpaceTransformChanged, this);
        }

        /**
		 * 处理镜头变化事件
		 */
        private onLensMatrixChanged(event: LensEvent): void {

            this._viewProjectionDirty = true;
            this.dispatchEvent(event);
        }

        private onSpaceTransformChanged(event: TransfromEvent): void {
            this._viewProjectionDirty = true;
        }

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic, camera: Camera3D) {

            //
            renderData.uniforms[RenderDataID.u_viewProjection] = this.viewProjection;
            renderData.uniforms[RenderDataID.u_cameraMatrix] = this.globalMatrix3d;
            //
            super.activate(renderData, camera);
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            delete renderData.uniforms[RenderDataID.u_viewProjection];
            delete renderData.uniforms[RenderDataID.u_cameraMatrix];
            super.deactivate(renderData);
        }
    }
}