namespace feng3d
{

	/**
	 * 截头锥体
	 * 
	 * Frustums are used to determine what is inside the camera's field of view. They help speed up the rendering process.
	 * 
	 * Frustums用于确定摄像机的视场范围。它们有助于加速渲染过程。
	 * 
	 * @author mrdoob / http://mrdoob.com/
	 * @author alteredq / http://alteredqualia.com/
	 * @author bhouston / http://clara.io
	 */
	export class Frustum
	{
		planes: Plane[];

		/**
		 * 初始化截头锥体
		 * 
		 * @param p0 
		 * @param p1 
		 * @param p2 
		 * @param p3 
		 * @param p4 
		 * @param p5 
		 */
		constructor(p0 = new Plane(), p1 = new Plane(), p2 = new Plane(), p3 = new Plane(), p4 = new Plane(), p5 = new Plane())
		{
			this.planes = [
				p0, p1, p2, p3, p4, p5
			];
		}

		set(p0: Plane, p1: Plane, p2: Plane, p3: Plane, p4: Plane, p5: Plane)
		{
			var planes = this.planes;

			planes[0].copy(p0);
			planes[1].copy(p1);
			planes[2].copy(p2);
			planes[3].copy(p3);
			planes[4].copy(p4);
			planes[5].copy(p5);

			return this;
		}

		clone()
		{
			return new Frustum().copy(this);
		}

		copy(frustum: Frustum)
		{

			var planes = this.planes;

			for (var i = 0; i < 6; i++)
			{

				planes[i].copy(frustum.planes[i]);

			}

			return this;
		}

		/**
		 * 从矩阵初始化
		 * 
		 * @param matrix4x4 矩阵
		 */
		fromMatrix(matrix4x4: Matrix4x4)
		{
			var planes = this.planes;
			var me = matrix4x4.elements;
			var me0 = me[0], me1 = me[1], me2 = me[2], me3 = me[3];
			var me4 = me[4], me5 = me[5], me6 = me[6], me7 = me[7];
			var me8 = me[8], me9 = me[9], me10 = me[10], me11 = me[11];
			var me12 = me[12], me13 = me[13], me14 = me[14], me15 = me[15];

			planes[0].set(me3 - me0, me7 - me4, me11 - me8, me15 - me12).normalize();
			planes[1].set(me3 + me0, me7 + me4, me11 + me8, me15 + me12).normalize();
			planes[2].set(me3 + me1, me7 + me5, me11 + me9, me15 + me13).normalize();
			planes[3].set(me3 - me1, me7 - me5, me11 - me9, me15 - me13).normalize();
			planes[4].set(me3 - me2, me7 - me6, me11 - me10, me15 - me14).normalize();
			planes[5].set(me3 + me2, me7 + me6, me11 + me10, me15 + me14).normalize();

			return this;
		}

		/**
		 * 是否与球体相交
		 * 
		 * @param sphere 球体
		 */
		intersectsSphere(sphere: Sphere)
		{
			var planes = this.planes;
			var center = sphere.center;
			var negRadius = - sphere.radius;

			for (var i = 0; i < 6; i++)
			{
				var distance = planes[i].distanceWithPoint(center);
				if (distance < negRadius)
				{
					return false;
				}
			}
			return true;
		}

		/**
		 * 是否与长方体相交
		 * 
		 * @param box 长方体
		 */
		intersectsBox(box: Box3)
		{
			var planes = this.planes;

			var temp = new Vector3();
			for (var i = 0; i < 6; i++)
			{
				var plane = planes[i];

				// corner at max distance
				var normal = plane.getNormal();

				temp.x = normal.x > 0 ? box.max.x : box.min.x;
				temp.y = normal.y > 0 ? box.max.y : box.min.y;
				temp.z = normal.z > 0 ? box.max.z : box.min.z;

				if (plane.distanceWithPoint(temp) < 0)
				{
					return false;
				}
			}
			return true;
		}

		/**
		 * 与点是否相交
		 * 
		 * @param point 
		 */
		containsPoint(point: Vector3, precision = Math.PRECISION)
		{
			var planes = this.planes;
			for (var i = 0; i < 6; i++)
			{
				if (planes[i].distanceWithPoint(point) < -precision)
				{
					return false;
				}
			}
			return true;
		}
	}
}