import { color4Multiply, minMaxGradientDefault, minMaxGradientGetValue } from '@feng3d/math';
import type { MinMaxGradient } from '@feng3d/math';
import type { Particle } from '../Particle';
import type { ParticleModuleLike, WritableParticleModuleLike } from './ParticleModule';

/**
 * 粒子系统 颜色随时间变化模块（纯数据接口 + 模块级行为函数）。
 *
 * 原 class 的 `initParticleState` / `updateParticleState` 逐行搬成
 * {@link particleColorOverLifetimeModuleInitParticleState} /
 * {@link particleColorOverLifetimeModuleUpdateParticleState}（`this.` → `module.`）。
 */
export interface ParticleColorOverLifetimeModuleLike extends ParticleModuleLike
{
    /**
     * 控制粒子颜色的梯度。
     *
     * `MinMaxGradient` 是纯数据接口：装配点显式写 `__type__`（面板按它选控件、序列化靠它识别），
     * 默认值由 `minMaxGradientDefault()` 补。
     */
    readonly color?: MinMaxGradient;
}

/** 可写出的颜色随时间变化模块（写侧形状）。 */
export interface WritableParticleColorOverLifetimeModuleLike extends WritableParticleModuleLike
{
    color: MinMaxGradient;
}

/** 纯数据「颜色随时间变化模块」（带判别字段）。 */
export interface ParticleColorOverLifetimeModule extends Required<ParticleColorOverLifetimeModuleLike>
{
    readonly __type__: 'ParticleColorOverLifetimeModule';
}

/**
 * `new ParticleColorOverLifetimeModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleColorOverLifetimeModuleDefault(out: WritableParticleColorOverLifetimeModuleLike = { enabled: false, color: { __type__: 'MinMaxGradient', ...minMaxGradientDefault() } }): WritableParticleColorOverLifetimeModuleLike
{
    out.enabled = false;
    out.color = { __type__: 'MinMaxGradient', ...minMaxGradientDefault() };

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleColorOverLifetimeModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleColorOverLifetimeModuleInitParticleState(module: ParticleColorOverLifetimeModule, particle: Particle): void
{
    particle[ColorOverLifetimeRate] = Math.random();
}

/**
 * 更新粒子状态（原 `ParticleColorOverLifetimeModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleColorOverLifetimeModuleUpdateParticleState(module: ParticleColorOverLifetimeModule, particle: Particle): void
{
    if (!module.enabled) return;

    color4Multiply(particle.color, minMaxGradientGetValue(module.color, particle.rateAtLifeTime, particle[ColorOverLifetimeRate]), particle.color);
}

const ColorOverLifetimeRate = '_ColorOverLifetime_rate';
