module feng3d {

	/**
	 * 点与面的相对位置
	 * @author feng
	 */
    export class PlaneClassification {
		/**
		 * 在平面后面
		 * <p>等价于平面内</p>
		 * @see #IN
		 */
        public static BACK: number = 0;
		/**
		 * 在平面前面
		 * <p>等价于平面外</p>
		 * @see #OUT
		 */
        public static FRONT: number = 1;

		/**
		 * 在平面内
		 * <p>等价于在平面后</p>
		 * @see #BACK
		 */
        public static IN: number = 0;
		/**
		 * 在平面外
		 * <p>等价于平面前面</p>
		 * @see #FRONT
		 */
        public static OUT: number = 1;

		/**
		 * 与平面相交
		 */
        public static INTERSECT: number = 2;
    }
}
