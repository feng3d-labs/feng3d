import { minMaxCurveVector3GetValue, vec3Add, vec3Copy, vec3From, vec3Sub } from '@feng3d/math';
import type { MinMaxCurveVector3, Vector3 } from '@feng3d/math';
import type { Particle } from '../Particle';
import { particleModuleVector3CurveDefault, type ParticleModuleLike, type WritableParticleModuleLike } from './ParticleModule';
/**
 * 旋转随时间变化模块（纯数据接口 + 模块级行为函数）。
 *
 * 原 class 的 `x` / `y` / `z` 与四个 `*Multiplier` getter/setter 是「转发到 `angularVelocity`」的
 * 便捷访问器，纯数据形态下调用方直接读写 `angularVelocity`。
 */
export interface ParticleRotationOverLifetimeModuleLike extends ParticleModuleLike
{
    /** 是否分轴设置 */
    readonly separateAxes?: boolean;

    /** 角速度曲线（三条轴，单位弧度/秒） */
    readonly angularVelocity?: MinMaxCurveVector3;
}

/** 可写出的旋转随时间变化模块（写侧形状）。 */
export interface WritableParticleRotationOverLifetimeModuleLike extends WritableParticleModuleLike
{
    separateAxes: boolean;
    angularVelocity: MinMaxCurveVector3;
}

/** 纯数据「旋转随时间变化模块」（带判别字段）。 */
export interface ParticleRotationOverLifetimeModule extends Required<ParticleRotationOverLifetimeModuleLike>
{
    readonly __type__: 'ParticleRotationOverLifetimeModule';
}

/**
 * `new ParticleRotationOverLifetimeModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleRotationOverLifetimeModuleDefault(out: WritableParticleRotationOverLifetimeModuleLike = { enabled: false, separateAxes: false, angularVelocity: particleModuleVector3CurveDefault(Math.PI / 4, false, Math.PI / 4) }): WritableParticleRotationOverLifetimeModuleLike
{
    out.enabled = false;
    out.separateAxes = false;
    out.angularVelocity = particleModuleVector3CurveDefault(Math.PI / 4, false, Math.PI / 4);

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleRotationOverLifetimeModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleRotationOverLifetimeModuleInitParticleState(module: ParticleRotationOverLifetimeModule, particle: Particle): void
{
    particle[RotationOverLifetimeRate] = Math.random();
    particle[RotationOverLifetimePreAngularVelocity] = { x: 0, y: 0, z: 0 };
}

/**
 * 更新粒子状态（原 `ParticleRotationOverLifetimeModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleRotationOverLifetimeModuleUpdateParticleState(module: ParticleRotationOverLifetimeModule, particle: Particle): void
{
    const preAngularVelocity: Vector3 = particle[RotationOverLifetimePreAngularVelocity];
    vec3Sub(particle.angularVelocity, preAngularVelocity, particle.angularVelocity);
    vec3From(0, 0, 0, preAngularVelocity);
    if (!module.enabled) return;

    const v = minMaxCurveVector3GetValue(module.angularVelocity, particle.rateAtLifeTime, particle[RotationOverLifetimeRate]);
    if (!module.separateAxes)
    {
        v.x = v.y = 0;
    }
    vec3Add(particle.angularVelocity, v, particle.angularVelocity);
    vec3Copy(v, preAngularVelocity);
}

const RotationOverLifetimeRate = '_RotationOverLifetime_rate';
const RotationOverLifetimePreAngularVelocity = '_RotationOverLifetime_preAngularVelocity';
