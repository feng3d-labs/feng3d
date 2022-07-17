namespace feng3d
{
	/**
	 * 摄像机镜头
	 * 
	 * 镜头主要作用是投影以及逆投影。
	 * 投影指的是从摄像机空间可视区域内的坐标投影至GPU空间可视区域内的坐标。
	 * 
	 * 摄像机可视区域：由近、远，上，下，左，右组成的四棱柱
	 * GPU空间可视区域：立方体 [(-1, -1, -1), (1, 1, 1)]
	 * 
	 */
	export abstract class LensBase extends Feng3dObject
	{
		/**
		 * 摄像机投影类型
		 */
		get projectionType()
		{
			return this._projectionType;
		}
		protected _projectionType: Projection;

		/**
		 * 最近距离
		 */
		@serialize
		@oav()
		@watch("invalidate")
		near: number;

		/**
		 * 最远距离
		 */
		@watch("invalidate")
		@serialize
		@oav()
		far: number;

		/**
		 * 视窗缩放比例(width/height)，在渲染器中设置
		 */
		@watch("invalidate")
		aspect: number;

		/**
		 * 创建一个摄像机镜头
		 */
		constructor(aspectRatio = 1, near = 0.3, far = 1000)
		{
			super();
			this.aspect = aspectRatio;
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
				this._updateMatrix();
				this._matrixInvalid = false;
			}
			return this._matrix;
		}

		/**
		 * 逆矩阵
		 */
		get inverseMatrix(): Matrix4x4
		{
			if (this._invertMatrixInvalid)
			{
				this._updateInverseMatrix();
				this._invertMatrixInvalid = false;
			}
			return this._inverseMatrix;
		}

		/**
		 * 摄像机空间坐标投影到GPU空间坐标
		 * @param point3d 摄像机空间坐标
		 * @param v GPU空间坐标
		 * @return GPU空间坐标
		 */
		project(point3d: Vector3, v = new Vector3()): Vector3
		{
			var v4 = this.matrix.transformVector4(Vector4.fromVector3(point3d, 1));
			v4.toVector3(v);
			return v;
		}

		/**
		 * GPU空间坐标投影到摄像机空间坐标
		 * @param point3d GPU空间坐标
		 * @param v 摄像机空间坐标（输出）
		 * @returns 摄像机空间坐标
		 */
		unproject(point3d: Vector3, v = new Vector3())
		{
			var v4 = this.inverseMatrix.transformVector4(Vector4.fromVector3(point3d, 1));
			v4.toVector3(v);
			return v;
		}

		/**
		 * 逆投影求射线
		 * 
		 * 通过GPU空间坐标x与y值求出摄像机空间坐标的射线
		 * 
		 * @param x GPU空间坐标x值
		 * @param y GPU空间坐标y值
		 */
		unprojectRay(x: number, y: number, ray = new Ray3())
		{
			var p0 = this.unproject(new Vector3(x, y, 0));
			var p1 = this.unproject(new Vector3(x, y, 1));
			// 初始化射线
			ray.fromPosAndDir(p0, p1.sub(p0));
			// 获取z==0的点
			var sp = ray.getPointWithZ(0);
			ray.origin = sp;
			return ray;
		}

		/**
		 * 指定深度逆投影
		 * 
		 * 获取投影在指定GPU坐标且摄像机前方（深度）sZ处的点的3D坐标
		 * 
		 * @param nX GPU空间坐标X
		 * @param nY GPU空间坐标Y
		 * @param sZ 到摄像机的距离
		 * @param v 摄像机空间坐标（输出）
		 * @return 摄像机空间坐标
		 */
		unprojectWithDepth(nX: number, nY: number, sZ: number, v = new Vector3())
		{
			return this.unprojectRay(nX, nY).getPointWithZ(sZ, v);
		}

		//
		private _inverseMatrix = new Matrix4x4();
		private _invertMatrixInvalid = true;
		//
		protected _matrix = new Matrix4x4();
		private _matrixInvalid = true;

		/**
		 * 投影矩阵失效
		 */
		protected invalidate()
		{
			console.assert(!isNaN(this.aspect));

			this._matrixInvalid = true;
			this._invertMatrixInvalid = true;
			this.emit("lensChanged", this);
		}

		private _updateInverseMatrix()
		{
			this._inverseMatrix.copy(this.matrix);
			this._inverseMatrix.invert();
		}

		/**
		 * 更新投影矩阵
		 */
		protected abstract _updateMatrix(): void;

		/**
		 * 克隆
		 */
		abstract clone(): LensBase;
	}
}
