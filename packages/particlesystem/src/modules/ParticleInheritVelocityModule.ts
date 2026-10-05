import { minMaxCurveDefault, minMaxCurveGetValue, vec3AddScaled } from '@feng3d/math';
import type { MinMaxCurve } from '@feng3d/math';
import { ParticleSystemInheritVelocityMode } from '../enums/ParticleSystemInheritVelocityMode';
import { ParticleSystemSimulationSpace } from '../enums/ParticleSystemSimulationSpace';
import type { Particle } from '../Particle';
import type { ParticleModuleLike, WritableParticleModuleLike } from './ParticleModule';

/**
 * 遗传速度模块（纯数据接口 + 模块级行为函数）。
 *
 * 控制发射体的速度在粒子发射时如何传递到粒子上（只有粒子系统在世界空间中模拟时生效）。
 * 原 class 的两个 getter/setter（`curve` / `curveMultiplier`）已删除——它们是「转发到 `multiplier`」的
 * 便捷访问器，纯数据形态下调用方直接读写 `multiplier`（仓内消费方只有测试）。
 */
export interface ParticleInheritVelocityModuleLike extends ParticleModuleLike
{
    /** 如何将发射体速度应用于粒子 */
    readonly mode?: ParticleSystemInheritVelocityMode;

    /** 曲线：定义在粒子的生命周期内应用了多少发射速度 */
    readonly multiplier?: MinMaxCurve;
}

/** 可写出的遗传速度模块（写侧形状）。 */
export interface WritableParticleInheritVelocityModuleLike extends WritableParticleModuleLike
{
    mode: ParticleSystemInheritVelocityMode;
    multiplier: MinMaxCurve;
}

/** 纯数据「遗传速度模块」（带判别字段）。 */
export interface ParticleInheritVelocityModule extends Required<ParticleInheritVelocityModuleLike>
{
    readonly __type__: 'ParticleInheritVelocityModule';
}

/**
 * `new ParticleInheritVelocityModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleInheritVelocityModuleDefault(out: WritableParticleInheritVelocityModuleLike = { enabled: false, mode: ParticleSystemInheritVelocityMode.Initial, multiplier: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 1, constantMin: 1, constantMax: 1 } }): WritableParticleInheritVelocityModuleLike
{
    out.enabled = false;
    out.mode = ParticleSystemInheritVelocityMode.Initial;
    out.multiplier = { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 1, constantMin: 1, constantMax: 1 };

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleInheritVelocityModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleInheritVelocityModuleInitParticleState(module: ParticleInheritVelocityModule, particle: Particle): void
{
    particle[InheritVelocityRate] = Math.random();

    if (!module.enabled) return;
    if (module.particleSystem!.main.simulationSpace === ParticleSystemSimulationSpace.Local) return;
    if (module.mode !== ParticleSystemInheritVelocityMode.Initial) return;

    const multiplier = minMaxCurveGetValue(module.multiplier, particle.rateAtLifeTime, particle[InheritVelocityRate]);

    vec3AddScaled(particle.velocity, multiplier, module.particleSystem!.emitInfo.speed, particle.velocity);
}

/**
 * 更新粒子状态（原 `ParticleInheritVelocityModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleInheritVelocityModuleUpdateParticleState(module: ParticleInheritVelocityModule, particle: Particle): void
{
    if (!module.enabled) return;
    if (module.particleSystem!.main.simulationSpace === ParticleSystemSimulationSpace.Local) return;
    if (module.mode !== ParticleSystemInheritVelocityMode.Current) return;

    const multiplier = minMaxCurveGetValue(module.multiplier, particle.rateAtLifeTime, particle[InheritVelocityRate]);

    vec3AddScaled(particle.position, multiplier, module.particleSystem!.emitInfo.moveVec, particle.position);
}

const InheritVelocityRate = '_InheritVelocity_rate';
