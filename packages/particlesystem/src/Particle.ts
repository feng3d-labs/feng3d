import { type Color4, vec3Add, vec3Copy, vec3ScaleNumber, WritableVector3Like } from '@feng3d/math';
import { ParticleSystemEmitInfo } from './ParticleSystem';

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
	position: WritableVector3Like = { x: 0, y: 0, z: 0 };

	/**
	 * 速度
	 */
	velocity: WritableVector3Like = { x: 0, y: 0, z: 0 };

	/**
	 * 加速度
	 */
	acceleration: WritableVector3Like = { x: 0, y: 0, z: 0 };

	/**
	 * 旋转角度
	 */
	rotation: WritableVector3Like = { x: 0, y: 0, z: 0 };

	/**
	 * 角速度
	 */
	angularVelocity: WritableVector3Like = { x: 0, y: 0, z: 0 };

	/**
	 * 尺寸
	 */
	size: WritableVector3Like = { x: 1, y: 1, z: 1 };

	/**
	 * 起始尺寸
	 */
	startSize: WritableVector3Like = { x: 1, y: 1, z: 1 };

	/**
	 * 颜色
	 *
	 * 阶段 C-b 起 math 的 `Color4` class 已删除：纯数据形态带判别字段，
	 * 默认值等于原 `new Color4()`（白色不透明）。
	 */
	color: Color4 = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };

	/**
	 * 起始颜色
	 */
	startColor: Color4 = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };

	/**
	 * 纹理UV缩放和偏移。
	 */
	tilingOffset = { x: 1, y: 1, z: 0, w: 0 };

	/**
	 * 在粒子上翻转UV坐标，使它们呈现水平镜像。
	 */
	flipUV = { x: 0, y: 0 };

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
	prePosition: WritableVector3Like;

	/**
	 * 当前记录位置
	 */
	curPosition: WritableVector3Like;

	/**
	 * 子发射器信息
	 */
	subEmitInfo: ParticleSystemEmitInfo;

	/**
	 * 更新状态
	 */
	updateState(time: number)
	{
		const preTime = Math.max(this.curTime, this.birthTime);
		time = Math.max(this.birthTime, time);

		//
		const deltaTime = time - preTime;

		// 计算速度
		vec3Add(this.velocity, vec3ScaleNumber(this.acceleration, deltaTime), this.velocity);

		// 计算位置
		this.position.x += this.velocity.x * deltaTime;
		this.position.y += this.velocity.y * deltaTime;
		this.position.z += this.velocity.z * deltaTime;

		// 计算角度
		vec3Add(this.rotation, vec3ScaleNumber(this.angularVelocity, deltaTime), this.rotation);

		// 记录粒子此次移动的起始时间以及起始位置
		this.prePosition = vec3Copy(this.curPosition);
		this.curPosition = vec3Copy(this.position);
		this.preTime = this.curTime;
		this.curTime = time;
	}
}
