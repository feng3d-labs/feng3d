module feng3d {

	/**
	 * 粒子
	 * 粒子系统会自动在shader中匹配一个"a_particle_${attribute}"顶点属性，例如
	 * @author feng 2014-11-13
	 */
	export interface Particle {

		/**
		 * 索引
		 */
		index: number;

		/**
		 * 粒子总数量
		 */
		total: number;

		/**
		 * 出生时间
		 */
		birthTime: number;

		/**
		 * 寿命
		 */
		lifetime: number;

		/**
		 * 位移
		 */
		position: Vector3D;

		/**
		 * 旋转
		 */
		rotation: Vector3D;

		/**
		 * 缩放
		 */
		scale: Vector3D;

		/**
		 * 速度
		 */
		velocity: Vector3D;

		/**
		 * 加速度
		 */
		acceleration: Vector3D;

		/**
		 * 颜色
		 */
		color: Color;
	}
}
