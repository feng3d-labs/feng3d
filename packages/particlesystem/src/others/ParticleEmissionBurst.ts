import { minMaxCurveDefault } from '@feng3d/math';
import type { MinMaxCurve } from '@feng3d/math';

/**
 * 发射爆发（纯数据接口 + 模块级行为函数）。
 *
 * 原 class 的 `minCount` / `maxCount` getter/setter 是「转发到 `count.constantMin/constantMax`」的便捷访问器
 * （仓内无消费方），删除；`isProbability` 由私有 `_isProbability` 提升为公开只读字段——它是运行时状态，
 * 由 `particleEmissionBurstCalculateProbability` 写入。
 */
export interface ParticleEmissionBurstLike
{
    /** 每次爆发发生的时间 */
    readonly time: number;

    /** 要发射的粒子数 */
    readonly count: MinMaxCurve;

    /** 爆发被触发的几率（0~1） */
    readonly probability: number;

    /** 本次是否触发（由 `calculateProbability` 按几率抽取） */
    readonly isProbability: boolean;
}

/** 可写出的发射爆发（写侧形状）。 */
export interface WritableParticleEmissionBurstLike
{
    time: number;
    count: MinMaxCurve;
    probability: number;
    isProbability: boolean;
}

/** 纯数据「发射爆发」（带判别字段）。 */
export interface ParticleEmissionBurst extends ParticleEmissionBurstLike
{
    readonly __type__: 'ParticleEmissionBurst';
}

/**
 * `new ParticleEmissionBurst()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleEmissionBurstDefault(out: WritableParticleEmissionBurstLike = { time: 0, count: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 30, constantMin: 30, constantMax: 30 }, probability: 1.0, isProbability: true }): WritableParticleEmissionBurstLike
{
    out.time = 0;
    out.count = { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 30, constantMin: 30, constantMax: 30 };
    out.probability = 1.0;
    out.isProbability = true;

    return out;
}

/**
 * 按触发几率抽取本次是否喷发（原 `ParticleEmissionBurst.calculateProbability`）。
 *
 * @param burst 爆发数据
 * @returns 本次是否触发
 */
export function particleEmissionBurstCalculateProbability(burst: WritableParticleEmissionBurstLike): boolean
{
    burst.isProbability = burst.probability >= Math.random();

    return burst.isProbability;
}
