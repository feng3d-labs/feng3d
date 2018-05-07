namespace feng3d
{
	/**
	 * 镜头事件
	 */
	export interface LensEventMap
	{
		matrixChanged;
	}

	export interface LensBase
	{
		once<K extends keyof LensEventMap>(type: K, listener: (event: LensEventMap[K]) => void, thisObject?: any, priority?: number): void;
		dispatch<K extends keyof LensEventMap>(type: K, data?: LensEventMap[K], bubbles?: boolean);
		has<K extends keyof LensEventMap>(type: K): boolean;
		on<K extends keyof LensEventMap>(type: K, listener: (event: LensEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean);
		off<K extends keyof LensEventMap>(type?: K, listener?: (event: LensEventMap[K]) => any, thisObject?: any);
	}

	/**
	 * 摄像机镜头
	 * @author feng 2014-10-14
	 */
	export abstract class LensBase extends EventDispatcher
	{
		/**
		 * 最近距离
		 */
		private _near = 0.3;
		@serialize
		@oav()
		get near()
		{
			return this._near;
		}
		set near(value)
		{
			if (this._near == value)
				return;
			this._near = value;
			this.invalidateMatrix();
		}

		/**
		 * 最远距离
		 */
		private _far = 2000;
		@serialize
		@oav()
		get far()
		{
			return this._far;
		}
		set far(value)
		{
			if (this._far == value)
				return;
			this._far = value;
			this.invalidateMatrix();
		}

		/**
		 * 视窗缩放比例(width/height)，在渲染器中设置
		 */
		private _aspectRatio = 1;
		@serialize
		@oav()
		get aspectRatio()
		{
			return this._aspectRatio;
		}
		set aspectRatio(value)
		{
			if (this._aspectRatio == value)
				return;
			this._aspectRatio = value;
			this.invalidateMatrix();
		}

		//
		protected _matrix: Matrix4x4 | null;
		protected _scissorRect: Rectangle = new Rectangle();
		protected _viewPort: Rectangle = new Rectangle();

		protected _frustumCorners: number[] = [];

		private _unprojection: Matrix4x4 | null;

		/**
		 * 创建一个摄像机镜头
		 */
		constructor()
		{
			super();
		}

		/**
		 * Retrieves the corner points of the lens frustum.
		 */
		get frustumCorners(): number[]
		{
			return this._frustumCorners;
		}

		set frustumCorners(frustumCorners: number[])
		{
			this._frustumCorners = frustumCorners;
		}

		/**
		 * 投影矩阵
		 */
		get matrix(): Matrix4x4
		{
			if (!this._matrix)
			{
				this._matrix = this.updateMatrix();
			}
			return this._matrix;
		}

		set matrix(value: Matrix4x4)
		{
			this._matrix = value;
			this.dispatch("matrixChanged", this);
			this.invalidateMatrix();
		}

		/**
		 * 场景坐标投影到屏幕坐标
		 * @param point3d 场景坐标
		 * @param v 屏幕坐标（输出）
		 * @return 屏幕坐标
		 */
		project(point3d: Vector3, v = new Vector3()): Vector3
		{
			var v4 = this.matrix.transformVector4(Vector4.fromVector3(point3d));
			v4.toVector3(v);
			v.x = v.x / v4.w;
			v.y = -v.y / v4.w;

			//z is unaffected by transform
			v.z = point3d.z;

			return v;
		}

		/**
		 * 投影逆矩阵
		 */
		get unprojectionMatrix(): Matrix4x4
		{
			if (!this._unprojection)
			{
				this._unprojection = new Matrix4x4();
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
		abstract unproject(nX: number, nY: number, sZ: number, v?: Vector3): Vector3;

		/**
		 * 投影矩阵失效
		 */
		protected invalidateMatrix()
		{
			this._matrix = null;
			this._unprojection = null;
			this.dispatch("matrixChanged", this);
		}

		/**
		 * 更新投影矩阵
		 */
		protected abstract updateMatrix(): Matrix4x4;
	}
}
