import { minMaxCurveDefault } from '@feng3d/math';
import type { MinMaxCurve } from '@feng3d/math';
import type { ParticleEmissionBurst } from '../others/ParticleEmissionBurst';
import type { ParticleModuleLike, WritableParticleModuleLike } from './ParticleModule';

/**
 * 粒子系统发射模块（纯数据接口 + 模块级行为函数）。
 *
 * 原 class 的 `rateOverTimeMultiplier` / `rateOverDistanceMultiplier` 便捷访问器与 `burstCount` getter 删除，
 * `getBursts` / `setBursts` 改为 `particleEmissionModule*` 函数；发射本身由 `ParticleSystem._emit` 处理，
 * 本模块没有 `initParticleState` / `updateParticleState`。
 */
export interface ParticleEmissionModuleLike extends ParticleModuleLike
{
    /** 随着时间的推移，新粒子产生的速度 */
    readonly rateOverTime?: MinMaxCurve;

    /** 产生新粒子的速度（通过距离，仅世界空间模拟且发射器移动时生效） */
    readonly rateOverDistance?: MinMaxCurve;

    /** 爆发数组 */
    readonly bursts?: readonly ParticleEmissionBurst[];
}

/** 可写出的发射模块（写侧形状）。 */
export interface WritableParticleEmissionModuleLike extends WritableParticleModuleLike
{
    rateOverTime: MinMaxCurve;
    rateOverDistance: MinMaxCurve;
    bursts: ParticleEmissionBurst[];
}

/** 纯数据「发射模块」（带判别字段）。 */
export interface ParticleEmissionModule extends Required<ParticleEmissionModuleLike>
{
    readonly __type__: 'ParticleEmissionModule';
}

/**
 * `new ParticleEmissionModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleEmissionModuleDefault(out: WritableParticleEmissionModuleLike = { enabled: false, rateOverTime: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1: true, constant: 10, constantMin: 10, constantMax: 10, curveMultiplier: 10 }, rateOverDistance: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1: true, constant: 0, constantMin: 0, constantMax: 1 }, bursts: [] }): WritableParticleEmissionModuleLike
{
    out.enabled = false;
    out.rateOverTime = { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1: true, constant: 10, constantMin: 10, constantMax: 10, curveMultiplier: 10 };
    out.rateOverDistance = { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1: true, constant: 0, constantMin: 0, constantMax: 1 };
    out.bursts = [];

    return out;
}

/**
 * 当前爆发次数（原 `burstCount` getter）。
 *
 * @param module 模块数据
 */
export function particleEmissionModuleBurstCount(module: ParticleEmissionModule): number
{
    return module.bursts.length;
}

/**
 * 取爆发数组（原 `getBursts`）。
 *
 * @param module 模块数据
 * @param bursts 要填充的爆发数组
 * @returns 数组中的爆发次数
 */
export function particleEmissionModuleGetBursts(module: ParticleEmissionModule, bursts: ParticleEmissionBurst[]): number
{
    bursts.length = module.bursts.length;
    for (let i = 0, n = bursts.length; i < n; i++)
    {
        bursts[i] = module.bursts[i];
    }

    return bursts.length;
}

/**
 * 设置爆发数组（原 `setBursts`）。
 *
 * @param module 模块数据
 * @param bursts 爆发的数组
 * @param size 可选的数组大小（默认取全部）
 */
export function particleEmissionModuleSetBursts(module: WritableParticleEmissionModuleLike, bursts: ParticleEmissionBurst[], size: number = Number.MAX_SAFE_INTEGER): void
{
    size = Math.min(bursts.length, size);
    for (let i = 0; i < size; i++)
    {
        module.bursts[i] = bursts[i];
    }
}
