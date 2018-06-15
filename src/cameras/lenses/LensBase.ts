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
		@serialize
		@oav()
		@watch("invalidateMatrix")
		near: number;

		/**
		 * 最远距离
		 */
		@serialize
		@oav()
		@watch("invalidateMatrix")
		far: number;

		/**
		 * 视窗缩放比例(width/height)，在渲染器中设置
		 */
		@serialize
		@oav()
		@watch("invalidateMatrix")
		aspectRatio: number;

		//
		private _matrixInvalid = true;
		private _invertMatrixInvalid = true;
		protected _matrix = new Matrix4x4();
		private _unprojection = new Matrix4x4();

		/**
		 * 创建一个摄像机镜头
		 */
		constructor(aspectRatio = 1, near = 0.3, far = 2000)
		{
			super();
			this.aspectRatio = aspectRatio;
			this.near = near;
			this.far = far;
		}

		/**
		 * 投影矩阵
		 */
		get matrix(): Matrix4x4
		{
			if (this._matrixInvalid)
			{
				this.updateMatrix();
				this._matrixInvalid = false;
			}
			return this._matrix;
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
			v4.scale(1 / v4.w)
			v4.toVector3(v);
			return v;
		}

		/**
		 * 投影逆矩阵
		 */
		get unprojectionMatrix(): Matrix4x4
		{
			if (this._invertMatrixInvalid)
			{
				this._unprojection.copyFrom(this.matrix);
				this._unprojection.invert();
				this._matrixInvalid = false;
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
			this._matrixInvalid = true;
			this._invertMatrixInvalid = true;
			this.dispatch("matrixChanged", this);
		}

		/**
		 * 更新投影矩阵
		 */
		protected abstract updateMatrix(): void;
	}
}
