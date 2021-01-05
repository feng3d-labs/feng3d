namespace feng3d
{
	/**
	 * 点与面的相对位置
	 */
	export enum PlaneClassification
	{
		/**
		 * 在平面后面
		 */
		BACK = 0,
		/**
		 * 在平面前面
		 */
		FRONT = 1,

		/**
		 * 与平面相交
		 */
		INTERSECT = 2,
	}
}