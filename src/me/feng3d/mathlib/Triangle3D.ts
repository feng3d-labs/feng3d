module feng3d
{
	

	/**
	 * 三角形
	 * @author feng 2014-5-4
	 */
	export class Triangle3D
	{
		private _p0:Vector3D;
		private _p1:Vector3D;
		private _p2:Vector3D;

		private _normal:Vector3D;

		public Triangle3D(p0:Vector3D, p1:Vector3D, p2:Vector3D)
		{
			this.p0 = p0;
			this.p1 = p1;
			this.p2 = p2;
		}

		/**
		 * 测试是否与直线相交
		 * @param line3D 直线
		 * @return 是否相交
		 */
		public testLineCollision(line3D:Line3D):boolean
		{
			return false;
		}

		/**
		 * 第1个点
		 */
		public get p0():Vector3D
		{
			return _p0;
		}

		public set p0(value:Vector3D)
		{
			_p0 = value;
		}

		/**
		 * 第2个点
		 */
		public get p1():Vector3D
		{
			return _p1;
		}

		public set p1(value:Vector3D)
		{
			_p1 = value;
		}

		/**
		 * 第3个点
		 */
		public get p2():Vector3D
		{
			return _p2;
		}

		public set p2(value:Vector3D)
		{
			_p2 = value;
		}

		/**
		 * 法线
		 */
		public get normal():Vector3D
		{
			if (_normal == null)
				updateNomal();
			return _normal;
		}

		private updateNomal()
		{
			_normal = p1.subtract(p0).crossProduct(p2.subtract(p0));
		}

	}
}
