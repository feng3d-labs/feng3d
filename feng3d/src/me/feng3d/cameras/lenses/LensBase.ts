module me.feng3d {

	/**
	 * 摄像机镜头
	 * @author feng 2014-10-14
	 */
	export abstract class LensBase extends Component {
		protected _matrix: Matrix3D;
		protected _scissorRect: Rectangle = new Rectangle();
		protected _viewPort: Rectangle = new Rectangle();
		protected _near: number = 0.1;
		protected _far: number = 3000;
		protected _aspectRatio: number = 1;

		protected _matrixInvalid: boolean = true;

		private _unprojection: Matrix3D;
		private _unprojectionInvalid: boolean = true;

		/**
		 * 创建一个摄像机镜头
		 */
		constructor() {
            super();
			this._matrix = new Matrix3D();
		}

		/**
		 * 投影矩阵
		 */
		public get matrix(): Matrix3D {
			if (this._matrixInvalid) {
				this.updateMatrix();
				this._matrixInvalid = false;
			}
			return this._matrix;
		}

		public set matrix(value: Matrix3D) {
			this._matrix = value;
			this.invalidateMatrix();
		}

		/**
		 * 最近距离
		 */
		public get near(): number {
			return this._near;
		}

		public set near(value: number) {
			if (value == this._near)
				return;
			this._near = value;
			this.invalidateMatrix();
		}

		/**
		 * 最远距离
		 */
		public get far(): number {
			return this._far;
		}

		public set far(value: number) {
			if (value == this._far)
				return;
			this._far = value;
			this.invalidateMatrix();
		}

		/**
		 * 视窗缩放比例(width/height)，在渲染器中设置
		 */
		public get aspectRatio(): number {
			return this._aspectRatio;
		}

		public set aspectRatio(value: number) {
			if (this._aspectRatio == value || (value * 0) != 0)
				return;
			this._aspectRatio = value;
			this.invalidateMatrix();
		}

		/**
		 * 场景坐标投影到屏幕坐标
		 * @param point3d 场景坐标
		 * @param v 屏幕坐标（输出）
		 * @return 屏幕坐标
		 */
		public project(point3d: Vector3D, v: Vector3D = null): Vector3D {
			if (!v)
				v = new Vector3D();
			this.matrix.transformVector(point3d, v);
			v.x = v.x / v.w;
			v.y = -v.y / v.w;

			v.z = point3d.z;

			return v;
		}

		/**
		 * 投影逆矩阵
		 */
		public get unprojectionMatrix(): Matrix3D {
			if (this._unprojectionInvalid) {
                if (this._unprojection == null)
					this._unprojection = new Matrix3D();
				this._unprojection.copyFrom(this.matrix);
				this._unprojection.invert();
				this._unprojectionInvalid = false;
			}

			return this._unprojection;
		}

		/**
		 * 屏幕坐标投影到摄像机空间坐标
		 * @param nX 屏幕坐标X -1（左） -> 1（右）
		 * @param nY 屏幕坐标Y -1（上） -> 1（下）
		 * @param sZ 到屏幕的距离
		 * @param v 场景坐标（输出）
		 * @return 场景坐标
		 */
		public abstract unproject(nX: number, nY: number, sZ: number, v: Vector3D): Vector3D;

		/**
		 * 投影矩阵失效
		 */
		protected invalidateMatrix() {
			this._matrixInvalid = true;
			this._unprojectionInvalid = true;
			this.dispatchEvent(new LensEvent(LensEvent.MATRIX_CHANGED, this));
		}

		/**
		 * 更新投影矩阵
		 */
		protected abstract updateMatrix();
	}
}
