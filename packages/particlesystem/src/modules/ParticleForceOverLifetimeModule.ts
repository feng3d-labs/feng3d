import { minMaxCurveVector3Default, minMaxCurveVector3GetValue } from '@feng3d/math';
import type { MinMaxCurveVector3 } from '@feng3d/math';
import { ParticleSystemSimulationSpace } from '../enums/ParticleSystemSimulationSpace';
import type { Particle } from '../Particle';
import type { ParticleModuleLike, WritableParticleModuleLike } from './ParticleModule';

/**
 * 作用在粒子上的力随时间变化模块（纯数据接口 + 模块级行为函数）。
 *
 * 控制每个粒子在其生命周期内的力。原 class 的 `x` / `y` / `z` 与三个 `*Multiplier`
 * getter/setter 是「转发到 `force`」的便捷访问器，纯数据形态下调用方直接读写 `force`（`.xCurve` / `.curveMultiplier`）。
 */
export interface ParticleForceOverLifetimeModuleLike extends ParticleModuleLike
{
    /** 作用在粒子上的力 */
    readonly force: MinMaxCurveVector3;

    /** 这些力是作用于局部空间还是世界空间 */
    readonly space: ParticleSystemSimulationSpace;

    /** 在两条曲线或常数之间随机取值时，是否每帧重新抽一次（@todo 尚未实现） */
    readonly randomized: boolean;
}

/** 可写出的力随时间变化模块（写侧形状）。 */
export interface WritableParticleForceOverLifetimeModuleLike extends WritableParticleModuleLike
{
    force: MinMaxCurveVector3;
    space: ParticleSystemSimulationSpace;
    randomized: boolean;
}

/** 纯数据「力随时间变化模块」（带判别字段）。 */
export interface ParticleForceOverLifetimeModule extends ParticleForceOverLifetimeModuleLike
{
    readonly __type__: 'ParticleForceOverLifetimeModule';
}

/**
 * `new ParticleForceOverLifetimeModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleForceOverLifetimeModuleDefault(out: WritableParticleForceOverLifetimeModuleLike = { enabled: false, force: { __type__: 'MinMaxCurveVector3', ...minMaxCurveVector3Default() }, space: ParticleSystemSimulationSpace.Local, randomized: false }): WritableParticleForceOverLifetimeModuleLike
{
    out.enabled = false;
    out.force = { __type__: 'MinMaxCurveVector3', ...minMaxCurveVector3Default() };
    out.space = ParticleSystemSimulationSpace.Local;
    out.randomized = false;

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleForceOverLifetimeModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleForceOverLifetimeModuleInitParticleState(module: ParticleForceOverLifetimeModuleLike, particle: Particle): void
{
    particle[ForceOverLifetimeRate] = Math.random();
}

/**
 * 更新粒子状态（原 `ParticleForceOverLifetimeModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleForceOverLifetimeModuleUpdateParticleState(module: ParticleForceOverLifetimeModuleLike, particle: Particle): void
{
    module.particleSystem!.removeParticleAcceleration(particle, ForceOverLifetimePreForce);
    if (!module.enabled) return;

    const force = minMaxCurveVector3GetValue(module.force, particle.rateAtLifeTime, particle[ForceOverLifetimeRate]);

    module.particleSystem!.addParticleAcceleration(particle, force, module.space, ForceOverLifetimePreForce);
}

const ForceOverLifetimeRate = '_ForceOverLifetime_rate';
const ForceOverLifetimePreForce = '_ForceOverLifetime_preForce';
