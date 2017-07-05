namespace feng3d
{

	/**
	 * 摄像机镜头
	 * @author feng 2014-10-14
	 */
	export abstract class LensBase 
	{
		/**
		 * 最近距离
		 */
		@watch("invalidateMatrix")
		@serialize
		public near = 0.1;
		
		/**
		 * 最远距离
		 */
		@watch("invalidateMatrix")
		@serialize
		public far: number = 10000;

		/**
		 * 视窗缩放比例(width/height)，在渲染器中设置
		 */
		@watch("invalidateMatrix")
		@serialize
		public aspectRatio: number = 1;

		//
		protected _matrix: Matrix3D;
		protected _scissorRect: Rectangle = new Rectangle();
		protected _viewPort: Rectangle = new Rectangle();

		protected _frustumCorners: number[] = [];

		private _unprojection: Matrix3D;

		/**
		 * 创建一个摄像机镜头
		 */
		constructor()
		{
		}

		/**
		 * Retrieves the corner points of the lens frustum.
		 */
		public get frustumCorners(): number[]
		{
			return this._frustumCorners;
		}

		public set frustumCorners(frustumCorners: number[])
		{
			this._frustumCorners = frustumCorners;
		}

		/**
		 * 投影矩阵
		 */
		public get matrix(): Matrix3D
		{
			if (!this._matrix)
			{
				this.updateMatrix();
			}
			return this._matrix;
		}

		public set matrix(value: Matrix3D)
		{
			this._matrix = value;
			Event.dispatch(this, <any>LensEvent.MATRIX_CHANGED, this);
			this.invalidateMatrix();
		}

		/**
		 * 场景坐标投影到屏幕坐标
		 * @param point3d 场景坐标
		 * @param v 屏幕坐标（输出）
		 * @return 屏幕坐标
		 */
		public project(point3d: Vector3D, v: Vector3D = null): Vector3D
		{
			if (!v)
				v = new Vector3D();
			this.matrix.transformVector(point3d, v);
			v.x = v.x / v.w;
			v.y = -v.y / v.w;

			//z is unaffected by transform
			v.z = point3d.z;

			return v;
		}

		/**
		 * 投影逆矩阵
		 */
		public get unprojectionMatrix(): Matrix3D
		{
			if (!this._unprojection)
			{
				this._unprojection = new Matrix3D();
				this._unprojection.copyFrom(this.matrix);
				this._unprojection.invert();
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
		protected invalidateMatrix()
		{
			this._matrix = null;
			Event.dispatch(this, <any>LensEvent.MATRIX_CHANGED, this);
			this._unprojection = null;
		}

		/**
		 * 更新投影矩阵
		 */
		protected abstract updateMatrix();
	}
}
