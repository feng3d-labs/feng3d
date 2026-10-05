import { minMaxCurveVector3GetValue, vec3Multiply } from '@feng3d/math';
import type { MinMaxCurveVector3 } from '@feng3d/math';
import type { Particle } from '../Particle';
import { particleModuleVector3CurveDefault, type ParticleModuleLike, type WritableParticleModuleLike } from './ParticleModule';
/**
 * 缩放随时间变化模块（纯数据接口 + 模块级行为函数）。
 *
 * 原 class 的 `size` / `x` / `y` / `z` 与四个 `*Multiplier` getter/setter 是「转发到 `size3D`」的
 * 便捷访问器，纯数据形态下调用方直接读写 `size3D`（`.xCurve` / `.curveMultiplier`）。
 */
export interface ParticleSizeOverLifetimeModuleLike extends ParticleModuleLike
{
    /** 是否分轴设置 */
    readonly separateAxes: boolean;

    /** 基于寿命的尺寸控制曲线（三条轴） */
    readonly size3D: MinMaxCurveVector3;
}

/** 可写出的缩放随时间变化模块（写侧形状）。 */
export interface WritableParticleSizeOverLifetimeModuleLike extends WritableParticleModuleLike
{
    separateAxes: boolean;
    size3D: MinMaxCurveVector3;
}

/** 纯数据「缩放随时间变化模块」（带判别字段）。 */
export interface ParticleSizeOverLifetimeModule extends ParticleSizeOverLifetimeModuleLike
{
    readonly __type__: 'ParticleSizeOverLifetimeModule';
}

/**
 * `new ParticleSizeOverLifetimeModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleSizeOverLifetimeModuleDefault(out: WritableParticleSizeOverLifetimeModuleLike = { enabled: false, separateAxes: false, size3D: particleModuleVector3CurveDefault(1, true, 1) }): WritableParticleSizeOverLifetimeModuleLike
{
    out.enabled = false;
    out.separateAxes = false;
    out.size3D = particleModuleVector3CurveDefault(1, true, 1);

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleSizeOverLifetimeModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleSizeOverLifetimeModuleInitParticleState(module: ParticleSizeOverLifetimeModuleLike, particle: Particle): void
{
    particle[SizeOverLifetimeRate] = Math.random();
}

/**
 * 更新粒子状态（原 `ParticleSizeOverLifetimeModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleSizeOverLifetimeModuleUpdateParticleState(module: ParticleSizeOverLifetimeModuleLike, particle: Particle): void
{
    if (!module.enabled) return;

    const size = minMaxCurveVector3GetValue(module.size3D, particle.rateAtLifeTime, particle[SizeOverLifetimeRate]);
    if (!module.separateAxes)
    {
        size.y = size.z = size.x;
    }
    vec3Multiply(particle.size, size, particle.size);
}

const SizeOverLifetimeRate = '_SizeOverLifetime_rate';
