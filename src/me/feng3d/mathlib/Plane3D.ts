module feng3d
{
	

	/**
	 * 3d面
	 */
	export class Plane3D
	{
		/**
		 * 平面A系数
		 * <p>同样也是面法线x尺寸</p>
		 */
		public a:number;

		/**
		 * 平面B系数
		 * <p>同样也是面法线y尺寸</p>
		 */
		public b:number;

		/**
		 * 平面C系数
		 * <p>同样也是面法线z尺寸</p>
		 */
		public c:number;

		/**
		 * 平面D系数
		 * <p>同样也是（0，0）点到平面的距离的负值</p>
		 */
		public d:number;

		/**
		 * 对齐类型
		 */
		public _alignment:number;

		/**
		 * 普通平面
		 * <p>不与对称轴平行或垂直</p>
		 */
		public static ALIGN_ANY:number = 0;
		/**
		 * XY方向平面
		 * <p>法线与Z轴平行</p>
		 */
		public static ALIGN_XY_AXIS:number = 1;

		/**
		 * YZ方向平面
		 * <p>法线与X轴平行</p>
		 */
		public static ALIGN_YZ_AXIS:number = 2;
		/**
		 * XZ方向平面
		 * <p>法线与Y轴平行</p>
		 */
		public static ALIGN_XZ_AXIS:number = 3;

		/**
		 * 创建一个平面
		 * @param a		A系数
		 * @param b		B系数
		 * @param c		C系数
		 * @param d		D系数
		 */
		public Plane3D(a:number = 0, b:number = 0, c:number = 0, d:number = 0)
		{
			this.a = a;
			this.b = b;
			this.c = c;
			this.d = d;
			if (a == 0 && b == 0)
				_alignment = ALIGN_XY_AXIS;
			else if (b == 0 && c == 0)
				_alignment = ALIGN_YZ_AXIS;
			else if (a == 0 && c == 0)
				_alignment = ALIGN_XZ_AXIS;
			else
				_alignment = ALIGN_ANY;
		}

		/**
		 * 通过3顶点定义一个平面
		 * @param p0		点0
		 * @param p1		点1
		 * @param p2		点2
		 */
		public fromPoints(p0:Vector3D, p1:Vector3D, p2:Vector3D)
		{
			//计算向量1
			var d1x:number = p1.x - p0.x;
			var d1y:number = p1.y - p0.y;
			var d1z:number = p1.z - p0.z;

			//计算向量2
			var d2x:number = p2.x - p0.x;
			var d2y:number = p2.y - p0.y;
			var d2z:number = p2.z - p0.z;

			//叉乘计算法线
			a = d1y * d2z - d1z * d2y;
			b = d1z * d2x - d1x * d2z;
			c = d1x * d2y - d1y * d2x;

			//平面上点与法线点乘计算D值
			d = a * p0.x + b * p0.y + c * p0.z;

			//法线平行z轴
			if (a == 0 && b == 0)
				_alignment = ALIGN_XY_AXIS;
			//法线平行x轴
			else if (b == 0 && c == 0)
				_alignment = ALIGN_YZ_AXIS;
			//法线平行y轴
			else if (a == 0 && c == 0)
				_alignment = ALIGN_XZ_AXIS;
			//法线不平行坐标轴
			else
				_alignment = ALIGN_ANY;
		}

		/**
		 * 根据法线与点定义平面
		 * @param normal		平面法线
		 * @param point			平面上任意一点
		 */
		public fromNormalAndPoint(normal:Vector3D, point:Vector3D)
		{
			a = normal.x;
			b = normal.y;
			c = normal.z;
			d = a * point.x + b * point.y + c * point.z;
			if (a == 0 && b == 0)
				_alignment = ALIGN_XY_AXIS;
			else if (b == 0 && c == 0)
				_alignment = ALIGN_YZ_AXIS;
			else if (a == 0 && c == 0)
				_alignment = ALIGN_XZ_AXIS;
			else
				_alignment = ALIGN_ANY;
		}

		/**
		 * 标准化平面
		 * @return		标准化后的平面
		 */
		public normalize():Plane3D
		{
			var len:number = 1 / Math.sqrt(a * a + b * b + c * c);
			a *= len;
			b *= len;
			c *= len;
			d *= len;
			return this;
		}

		/**
		 * 计算点与平面的距离
		 * @param p		点
		 * @returns		距离
		 */
		public distance(p:Vector3D):number
		{
			if (_alignment == ALIGN_YZ_AXIS)
				return a * p.x - d;
			else if (_alignment == ALIGN_XZ_AXIS)
				return b * p.y - d;
			else if (_alignment == ALIGN_XY_AXIS)
				return c * p.z - d;
			else
				return a * p.x + b * p.y + c * p.z - d;
		}

		/**
		 * 顶点分类
		 * <p>把顶点分为后面、前面、相交三类</p>
		 * @param p			顶点
		 * @return			顶点类型 PlaneClassification.BACK,PlaneClassification.FRONT,PlaneClassification.INTERSECT
		 * @see				me.feng3d.core.math.PlaneClassification
		 */
		public classifyPoint(p:Vector3D, epsilon:number = 0.01):number
		{
			// check NaN
			if (d != d)
				return PlaneClassification.FRONT;

			var len:number;
			if (_alignment == ALIGN_YZ_AXIS)
				len = a * p.x - d;
			else if (_alignment == ALIGN_XZ_AXIS)
				len = b * p.y - d;
			else if (_alignment == ALIGN_XY_AXIS)
				len = c * p.z - d;
			else
				len = a * p.x + b * p.y + c * p.z - d;

			if (len < -epsilon)
				return PlaneClassification.BACK;
			else if (len > epsilon)
				return PlaneClassification.FRONT;
			else
				return PlaneClassification.INTERSECT;
		}

		/**
		 * 输出字符串
		 */
		public toString():string
		{
			return "Plane3D [a:" + a + ", b:" + b + ", c:" + c + ", d:" + d + "]";
		}
	}
}
