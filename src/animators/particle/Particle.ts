namespace feng3d
{

	/**
	 * 粒子
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
		 * 起始速度
		 */
		startVelocity = new Vector3();

		/**
		 * 起始加速度
		 */
		startAcceleration = new Vector3();

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
		 * 附加速度，作用于初始速度
		 */
		addVelocity = new Vector3();

		/**
		 * 旋转
		 */
		// rotation = new Vector3();

		/**
		 * 缩放
		 */
		// scale = new Vector3(1, 1, 1);

		/**
		 * 更新状态
		 */
		updateState(time: number)
		{
			var pTime = time - this.birthTime;

			// 计算位置
			this.position.x = this.startPosition.x + (this.startVelocity.x + this.addVelocity.x + this.startAcceleration.x * pTime) * pTime;
			this.position.y = this.startPosition.y + (this.startVelocity.y + this.addVelocity.y + this.startAcceleration.y * pTime) * pTime;
			this.position.z = this.startPosition.z + (this.startVelocity.z + this.addVelocity.z + this.startAcceleration.z * pTime) * pTime;

			// 计算颜色值
			this.color.copyFrom(this.startColor);
		}
	}
}
