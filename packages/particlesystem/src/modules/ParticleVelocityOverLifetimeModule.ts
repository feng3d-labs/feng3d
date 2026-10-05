import { minMaxCurveVector3Default, minMaxCurveVector3GetValue } from '@feng3d/math';
import type { MinMaxCurveVector3 } from '@feng3d/math';
import { ParticleSystemSimulationSpace } from '../enums/ParticleSystemSimulationSpace';
import type { Particle } from '../Particle';
import type { ParticleModuleLike, WritableParticleModuleLike } from './ParticleModule';

/**
 * 速度随时间变化模块（纯数据接口 + 模块级行为函数）。
 *
 * 原 class 的 `x` / `y` / `z` 与四个 `*Multiplier` getter/setter 是「转发到 `velocity`」的便捷访问器，删除。
 */
export interface ParticleVelocityOverLifetimeModuleLike extends ParticleModuleLike
{
    /** 基于寿命的速度控制曲线（三条轴） */
    readonly velocity: MinMaxCurveVector3;

    /** 速度作用于局部空间还是世界空间 */
    readonly space: ParticleSystemSimulationSpace;
}

/** 可写出的速度随时间变化模块（写侧形状）。 */
export interface WritableParticleVelocityOverLifetimeModuleLike extends WritableParticleModuleLike
{
    velocity: MinMaxCurveVector3;
    space: ParticleSystemSimulationSpace;
}

/** 纯数据「速度随时间变化模块」（带判别字段）。 */
export interface ParticleVelocityOverLifetimeModule extends ParticleVelocityOverLifetimeModuleLike
{
    readonly __type__: 'ParticleVelocityOverLifetimeModule';
}

/**
 * `new ParticleVelocityOverLifetimeModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleVelocityOverLifetimeModuleDefault(out: WritableParticleVelocityOverLifetimeModuleLike = { enabled: false, velocity: { __type__: 'MinMaxCurveVector3', ...minMaxCurveVector3Default() }, space: ParticleSystemSimulationSpace.Local }): WritableParticleVelocityOverLifetimeModuleLike
{
    out.enabled = false;
    out.velocity = { __type__: 'MinMaxCurveVector3', ...minMaxCurveVector3Default() };
    out.space = ParticleSystemSimulationSpace.Local;

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleVelocityOverLifetimeModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleVelocityOverLifetimeModuleInitParticleState(module: ParticleVelocityOverLifetimeModuleLike, particle: Particle): void
{
    particle[VelocityOverLifetimeRate] = Math.random();
}

/**
 * 更新粒子状态（原 `ParticleVelocityOverLifetimeModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleVelocityOverLifetimeModuleUpdateParticleState(module: ParticleVelocityOverLifetimeModuleLike, particle: Particle): void
{
    module.particleSystem!.removeParticleVelocity(particle, VelocityOverLifetimePreVelocity);
    if (!module.enabled) return;

    const velocity = minMaxCurveVector3GetValue(module.velocity, particle.rateAtLifeTime, particle[VelocityOverLifetimeRate]);

    module.particleSystem!.addParticleVelocity(particle, velocity, module.space, VelocityOverLifetimePreVelocity);
}

const VelocityOverLifetimeRate = '_VelocityOverLifetime_rate';
const VelocityOverLifetimePreVelocity = '_VelocityOverLifetime_preVelocity';
