module feng3d
{

	/**
	 * 点与面的相对位置
	 * @author feng
	 */
	export class PlaneClassification
	{
		/**
		 * 在平面后面
		 * <p>等价于平面内</p>
		 * @see #IN
		 */
		static BACK = 0;
		/**
		 * 在平面前面
		 * <p>等价于平面外</p>
		 * @see #OUT
		 */
		static FRONT = 1;

		/**
		 * 在平面内
		 * <p>等价于在平面后</p>
		 * @see #BACK
		 */
		static IN = 0;
		/**
		 * 在平面外
		 * <p>等价于平面前面</p>
		 * @see #FRONT
		 */
		static OUT = 1;

		/**
		 * 与平面相交
		 */
		static INTERSECT = 2;
	}
}
