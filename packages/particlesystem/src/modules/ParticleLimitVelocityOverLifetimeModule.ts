import { mat4Copy, mat4Identity, mat4Invert, mat4TransformVector3, minMaxCurveDefault, minMaxCurveGetValue, minMaxCurveVector3Default, minMaxCurveVector3GetValue, vec3Clamp, vec3Copy, vec3LengthSquared, vec3LerpNumber, vec3Negate, vec3NormalizeThickness } from '@feng3d/math';
import type { Matrix4x4, MinMaxCurve, MinMaxCurveVector3 } from '@feng3d/math';
import { logic } from 'feng3d';
import { ParticleSystemSimulationSpace } from '../enums/ParticleSystemSimulationSpace';
import type { Particle } from '../Particle';
import type { ParticleModuleLike, WritableParticleModuleLike } from './ParticleModule';

/**
 * 基于时间轴限制速度模块（纯数据接口 + 模块级行为函数）。
 *
 * 原 class 的 `limitMultiplier` / `limitX` / `limitXMultiplier` … 这批 getter/setter 是
 * 「转发到 `limit` / `limit3D`」的便捷访问器，纯数据形态下调用方直接读写对应曲线。
 */
export interface ParticleLimitVelocityOverLifetimeModuleLike extends ParticleModuleLike
{
    /** 在每个轴上分别设置生命周期的最大速度 */
    readonly separateAxes?: boolean;

    /** 最大速度曲线（未分轴时） */
    readonly limit?: MinMaxCurve;

    /** 最大速度（分轴） */
    readonly limit3D?: MinMaxCurveVector3;

    /** 速度在局部空间还是世界空间 */
    readonly space?: ParticleSystemSimulationSpace;

    /** 超过速度限制的部分被抑制多少 */
    readonly dampen?: number;
}

/** 可写出的限速模块（写侧形状）。 */
export interface WritableParticleLimitVelocityOverLifetimeModuleLike extends WritableParticleModuleLike
{
    separateAxes: boolean;
    limit: MinMaxCurve;
    limit3D: MinMaxCurveVector3;
    space: ParticleSystemSimulationSpace;
    dampen: number;
}

/** 纯数据「基于时间轴限制速度模块」（带判别字段）。 */
export interface ParticleLimitVelocityOverLifetimeModule extends Required<ParticleLimitVelocityOverLifetimeModuleLike>
{
    readonly __type__: 'ParticleLimitVelocityOverLifetimeModule';
}

/**
 * `new ParticleLimitVelocityOverLifetimeModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
/** 分轴限速曲线的默认值：三条轴曲线都覆盖成 `between0And1 + constant 1`（与原 class 的 setValue 逐字一致） */
function limit3DDefault(): MinMaxCurveVector3
{
    return {
        __type__: 'MinMaxCurveVector3',
        ...minMaxCurveVector3Default(),
        xCurve: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1: true, constant: 1, constantMin: 1, constantMax: 1 },
        yCurve: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1: true, constant: 1, constantMin: 1, constantMax: 1 },
        zCurve: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1: true, constant: 1, constantMin: 1, constantMax: 1 },
    };
}

export function particleLimitVelocityOverLifetimeModuleDefault(out: WritableParticleLimitVelocityOverLifetimeModuleLike = { enabled: false, separateAxes: false, limit: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1: true, constant: 1, constantMin: 1, constantMax: 1 }, limit3D: limit3DDefault(), space: ParticleSystemSimulationSpace.Local, dampen: 1 }): WritableParticleLimitVelocityOverLifetimeModuleLike
{
    out.enabled = false;
    out.separateAxes = false;
    out.limit = { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1: true, constant: 1, constantMin: 1, constantMax: 1 };
    out.limit3D = limit3DDefault();
    out.space = ParticleSystemSimulationSpace.Local;
    out.dampen = 1;

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleLimitVelocityOverLifetimeModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleLimitVelocityOverLifetimeModuleInitParticleState(module: ParticleLimitVelocityOverLifetimeModule, particle: Particle): void
{
    particle[LimitVelocityOverLifetimeRate] = Math.random();
}

/**
 * 更新粒子状态（原 `ParticleLimitVelocityOverLifetimeModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleLimitVelocityOverLifetimeModuleUpdateParticleState(module: ParticleLimitVelocityOverLifetimeModule, particle: Particle): void
{
    if (!module.enabled) return;

    const limit3D = minMaxCurveVector3GetValue(module.limit3D, particle.rateAtLifeTime, particle[LimitVelocityOverLifetimeRate]);
    const limit = minMaxCurveGetValue(module.limit, particle.rateAtLifeTime, particle[LimitVelocityOverLifetimeRate]);
    const pVelocity = vec3Copy(particle.velocity);

    // 计算变换矩阵
    const mat: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Identity() };
    //
    if (module.space !== module.particleSystem!.main.simulationSpace)
    {
        if (module.space === ParticleSystemSimulationSpace.World)
        {
            mat4Copy(logic(module.particleSystem!.object3D).local2world, mat);
        }
        else
        {
            mat4Copy(logic(module.particleSystem!.object3D).world2local, mat);
        }
    }
    // 变换到现在空间进行限速
    mat4TransformVector3(mat, pVelocity, pVelocity);
    if (module.separateAxes)
    {
        vec3Clamp(pVelocity, vec3Negate(limit3D), limit3D, pVelocity);
    }
    else
        if (vec3LengthSquared(pVelocity) > limit * limit)
        { vec3NormalizeThickness(pVelocity, limit, pVelocity); }
    mat4Invert(mat, mat);
    // 还原到原空间
    mat4TransformVector3(mat, pVelocity, pVelocity);
    //
    vec3LerpNumber(particle.velocity, pVelocity, module.dampen, particle.velocity);
}

const LimitVelocityOverLifetimeRate = '_LimitVelocityOverLifetime_rate';
