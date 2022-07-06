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
		 * 缓存，用于存储计算时临时数据
		 */
		cache = {};

		/**
		 * 上次记录的时间
		 */
		preTime: number;

		/**
		 * 当前记录的时间
		 */
		curTime: number;

		/**
		 * 上次记录位置
		 */
		prePosition: Vector3;

		/**
		 * 当前记录位置
		 */
		curPosition: Vector3;

		/**
		 * 子发射器信息
		 */
		subEmitInfo: ParticleSystemEmitInfo;

		/**
		 * 更新状态
		 */
		updateState(time: number)
		{
			var preTime = Math.max(this.curTime, this.birthTime);
			time = Math.max(this.birthTime, time);

			//
			var deltaTime = time - preTime;

			// 计算速度
			this.velocity.add(this.acceleration.scaleNumberTo(deltaTime));

			// 计算位置
			this.position.x += this.velocity.x * deltaTime;
			this.position.y += this.velocity.y * deltaTime;
			this.position.z += this.velocity.z * deltaTime;

			// 计算角度
			this.rotation.add(this.angularVelocity.scaleNumberTo(deltaTime));

			// 记录粒子此次移动的起始时间以及起始位置
			this.prePosition = this.curPosition.clone();
			this.curPosition = this.position.clone();
			this.preTime = this.curTime;
			this.curTime = time;
		}
	}
}
