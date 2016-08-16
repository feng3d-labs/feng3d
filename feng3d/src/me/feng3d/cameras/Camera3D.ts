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
		 * 处理镜头变化事件
		 */
        private onLensMatrixChanged(event: LensEvent): void {

            this._viewProjectionDirty = true;
            this.dispatchEvent(event);
        }
    }
}