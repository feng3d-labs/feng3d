module feng3d {

	/**
	 * 3D对象事件(3D状态发生改变、位置、旋转、缩放)
	 * @author feng 2014-3-31
	 */
    export class Transform3DEvent extends Event {
		/**
		 * 平移
		 */
        public static POSITION_CHANGED: string = "positionChanged";

		/**
		 * 旋转
		 */
        public static ROTATION_CHANGED: string = "rotationChanged";

		/**
		 * 缩放
		 */
        public static SCALE_CHANGED: string = "scaleChanged";

		/**
		 * 变换
		 */
        public static TRANSFORM_CHANGED: string = "transformChanged";

		/**
		 * 变换已更新
		 */
        public static TRANSFORM_UPDATED: string = "transformUpdated";

		/**
		 * 场景变换矩阵发生变化
		 */
        public static SCENETRANSFORM_CHANGED: string = "scenetransformChanged";

		/**
		 * 创建3D对象事件
		 * @param type			事件类型
		 * @param element3D		发出事件的3D元素
		 */
        constructor(type: string, element3D: Element3D, bubbles = false, cancelable: boolean = false) {
            super(type, element3D, bubbles, cancelable);
        }

		/**
		 * 发出事件的3D元素
		 */
        public get element3D(): Element3D {
            return this.data as Element3D;
        }
    }
}
