namespace feng3d
{

	/**
	 * 粒子
	 * 粒子系统会自动在shader中匹配一个"a_particle_${attribute}"顶点属性"
	 * 例如：position 对应 a_particle_position

	 */
	export class Particle
	{
		/**
		 * 出生时间
		 */
		birthTime = 0;

		/**
		 * 寿命
		 */
		lifetime = 5;

		/**
		 * 起始位置
		 */
		startPosition = new Vector3();

		/**
		 * 起始速度
		 */
		startSpeed = 1;

		/**
		 * 起始颜色
		 */
		startColor = new Color4();

		/**
		 * 计算后的位置
		 */
		position = new Vector3();

		/**
		 * 颜色
		 */
		color = new Color4();

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
		 * 更新状态
		 */
		updateState(time: number)
		{
			var pTime = time - this.birthTime;

			// 计算位置
			this.position.x = this.startPosition.x + (this.velocity.x + this.acceleration.x * pTime) * pTime;
			this.position.y = this.startPosition.y + (this.velocity.y + this.acceleration.y * pTime) * pTime;
			this.position.z = this.startPosition.z + (this.velocity.z + this.acceleration.z * pTime) * pTime;

			// 计算颜色值
			this.color.copyFrom(this.startColor);
		}
	}
}
