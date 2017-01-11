module feng3d {

	/**
	 * 粒子
	 * @author feng 2014-11-13
	 */
	export class Particle {

		/**
		 * 索引
		 */
		public index: number;

		/**
		 * 出生时间
		 */
		public birthTime: number;

		/**
		 * 寿命
		 */
		public lifetime: number;

		/**
		 * 位移
		 */
		public position: Vector3D;

		/**
		 * 旋转
		 */
		public rotation: Vector3D;

		/**
		 * 缩放
		 */
		public scale: Vector3D;

		/**
		 * 速度
		 */
		public velocity: Vector3D;

		/**
		 * 加速度
		 */
		public acceleration: Vector3D;

		/**
		 * 颜色
		 */
		public color: Color;
	}
}
