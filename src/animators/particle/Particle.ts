namespace feng3d
{

	/**
	 * 粒子
	 * 粒子系统会自动在shader中匹配一个"a_particle_${attribute}"顶点属性"
	 * 例如：position 对应 a_particle_position
	 * @author feng 2017-01-12
	 */
	export class Particle
	{

		/**
		 * 索引
		 */
		index = 0;

		/**
		 * 出生时间
		 */
		birthTime = 0;

		/**
		 * 寿命
		 */
		lifetime = 5;

		/**
		 * 位移
		 */
		position = new Vector3();

		/**
		 * 旋转
		 */
		// rotation = new Vector3();

		/**
		 * 缩放
		 */
		// scale = new Vector3(1, 1, 1);

		/**
		 * 速度
		 */
		velocity = new Vector3();

		/**
		 * 加速度
		 */
		acceleration = new Vector3();

		/**
		 * 颜色
		 */
		color = new Color4();

		constructor(index: number)
		{
			this.index = index;
		}
	}
}
