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
		 * 位置
		 */
		position = new Vector3();

		/**
		 * 速度
		 */
		velocity = new Vector3();

		/**
		 * 加速度
		 */
		acceleration = new Vector3();

		/**
		 * 旋转角度
		 */
		rotation = new Vector3();

		/**
		 * 角速度
		 */
		angularVelocity = new Vector3();

		/**
		 * 尺寸
		 */
		size = new Vector3(1, 1, 1);

		/**
		 * 起始尺寸
		 */
		startSize = new Vector3(1, 1, 1);

		/**
		 * 颜色
		 */
		color = new Color4();

		/**
		 * 起始颜色
		 */
		startColor = new Color4();

		/**
		 * 纹理UV缩放和偏移。
		 */
		tilingOffset = new Vector4(1, 1, 0, 0);

		/**
		 * 在粒子上翻转UV坐标，使它们呈现水平镜像。
		 */
		flipUV = new Vector2();

		/**
		 * 出生时在周期的位置（在发射时被更新）
		 */
		birthRateAtDuration: number;

		/**
		 * 此时粒子在生命周期的位置（在更新状态前被更新）
		 */
		rateAtLifeTime: number;

		/**
		 * 更新状态
		 */
		updateState(preTime: number, time: number)
		{
			preTime = Math.max(preTime, this.birthTime);
			time = Math.max(this.birthTime, time);

			var pTime = time - preTime;

			// 计算速度
			this.velocity.add(this.acceleration.scaleNumberTo(pTime));

			// 计算位置
			this.position.x += this.velocity.x * pTime;
			this.position.y += this.velocity.y * pTime;
			this.position.z += this.velocity.z * pTime;

			// 计算角度
			this.rotation.add(this.angularVelocity.scaleNumberTo(pTime));
		}
	}
}
