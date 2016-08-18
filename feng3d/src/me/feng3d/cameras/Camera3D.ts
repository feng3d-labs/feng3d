module me.feng3d {

	/**
	 * 摄像机
	 * @author feng 2016-08-16
	 */
    export class Camera3D extends Object3D {

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
		 * 场景投影矩阵，世界空间转投影空间
		 */
        public get viewProjection(): Matrix3D {
            if (this._viewProjectionDirty) {
                var inverseSceneTransform = this.space3D.transform3D.clone();
                inverseSceneTransform.invert();
                //场景空间转摄像机空间
                this._viewProjection.copyFrom(inverseSceneTransform);
                //+摄像机空间转投影空间 = 场景空间转投影空间
                this._viewProjection.append(this._lens.matrix);
                this._viewProjectionDirty = false;
            }

            return this._viewProjection;
        }

        /**
		 * 处理镜头变化事件
		 */
        private onLensMatrixChanged(event: LensEvent): void {

            this._viewProjectionDirty = true;
            this.dispatchEvent(event);
        }
    }
}