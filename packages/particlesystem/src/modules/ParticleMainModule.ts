import { color4Copy, minMaxCurveDefault, minMaxCurveGetValue, minMaxCurveVector3GetValue, minMaxGradientDefault, minMaxGradientGetValue, vec3Copy, vec3From, vec3ScaleNumber } from '@feng3d/math';
import type { MinMaxCurve, MinMaxCurveVector3, MinMaxGradient } from '@feng3d/math';
import { ParticleSystemScalingMode } from '../enums/ParticleSystemScalingMode';
import { ParticleSystemSimulationSpace } from '../enums/ParticleSystemSimulationSpace';
import type { Particle } from '../Particle';
import { particleModuleVector3CurveDefault, type ParticleModuleLike, type WritableParticleModuleLike } from './ParticleModule';

/**
 * 粒子系统主模块（纯数据接口 + 模块级行为函数）。
 *
 * 原 class 的 `startDelayMultiplier` / `startLifetimeMultiplier` / `startSpeedMultiplier` /
 * `startSize*` / `startSize*Multiplier` / `startRotation*` / `startRotation*Multiplier` 这一大批
 * getter/setter 都是「转发到曲线」或「转发到 `startSize3D.xCurve` / `startRotation3D.xCurve`」的便捷访问器，
 * 纯数据形态下一律删除：调用方直接读写曲线字段。
 */
export interface ParticleMainModuleLike extends ParticleModuleLike
{
    /** 粒子系统的持续时间（秒） */
    readonly duration?: number;

    /** 是否循环 */
    readonly loop?: boolean;

    /** 是否预热（循环开始前先模拟一轮） */
    readonly prewarm?: boolean;

    /** 启动延迟曲线 */
    readonly startDelay?: MinMaxCurve;

    /** 每个新粒子的总寿命（秒） */
    readonly startLifetime?: MinMaxCurve;

    /** 粒子发射时的初始速度 */
    readonly startSpeed?: MinMaxCurve;

    /** 是否分轴指定初始尺寸 */
    readonly useStartSize3D?: boolean;

    /** 初始尺寸曲线（三条轴） */
    readonly startSize3D?: MinMaxCurveVector3;

    /** 是否分轴指定初始旋转 */
    readonly useStartRotation3D?: boolean;

    /** 初始旋转曲线（三条轴，单位弧度） */
    readonly startRotation3D?: MinMaxCurveVector3;

    /** 反向自旋的粒子比例（0~1） */
    readonly randomizeRotationDirection?: number;

    /** 粒子发射时的初始颜色 */
    readonly startColor?: MinMaxGradient;

    /** 重力的缩放 */
    readonly gravityModifier?: MinMaxCurve;

    /** 模拟空间 */
    readonly simulationSpace?: ParticleSystemSimulationSpace;

    /** 模拟速度 */
    readonly simulationSpeed?: number;

    /** 缩放模式 */
    readonly scalingMode?: ParticleSystemScalingMode;

    /** 是否在唤醒时播放 */
    readonly playOnAwake?: boolean;

    /** 最大粒子数 */
    readonly maxParticles?: number;
}

/** 可写出的主模块（写侧形状）。 */
export interface WritableParticleMainModuleLike extends WritableParticleModuleLike
{
    duration: number;
    loop: boolean;
    prewarm: boolean;
    startDelay: MinMaxCurve;
    startLifetime: MinMaxCurve;
    startSpeed: MinMaxCurve;
    useStartSize3D: boolean;
    startSize3D: MinMaxCurveVector3;
    useStartRotation3D: boolean;
    startRotation3D: MinMaxCurveVector3;
    randomizeRotationDirection: number;
    startColor: MinMaxGradient;
    gravityModifier: MinMaxCurve;
    simulationSpace: ParticleSystemSimulationSpace;
    simulationSpeed: number;
    scalingMode: ParticleSystemScalingMode;
    playOnAwake: boolean;
    maxParticles: number;
}

/** 纯数据「主模块」（带判别字段）。 */
export interface ParticleMainModule extends Required<ParticleMainModuleLike>
{
    readonly __type__: 'ParticleMainModule';
}

/**
 * `new ParticleMainModule()` 的纯函数版：字段默认值与原 class 逐字一致
 * （原 `serialization.setValue` 的覆盖在这里展开为完整字面量）。
 *
 * 注意 `enabled` 默认是 **true**（主模块恒开）。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleMainModuleDefault(out: WritableParticleMainModuleLike = {
    enabled: true,
    duration: 5,
    loop: true,
    prewarm: false,
    startDelay: { __type__: 'MinMaxCurve', ...minMaxCurveDefault() },
    startLifetime: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1: true, constant: 5, constantMin: 5, constantMax: 5 },
    startSpeed: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 5, constantMin: 5, constantMax: 5 },
    useStartSize3D: false,
    startSize3D: particleModuleVector3CurveDefault(1, true, 1),
    useStartRotation3D: false,
    startRotation3D: particleModuleVector3CurveDefault(0, false, Math.PI),
    randomizeRotationDirection: 0,
    startColor: { __type__: 'MinMaxGradient', ...minMaxGradientDefault() },
    gravityModifier: { __type__: 'MinMaxCurve', ...minMaxCurveDefault() },
    simulationSpace: ParticleSystemSimulationSpace.Local,
    simulationSpeed: 1,
    scalingMode: ParticleSystemScalingMode.Local,
    playOnAwake: true,
    maxParticles: 1000,
}): WritableParticleMainModuleLike
{
    out.enabled = true;
    out.duration = 5;
    out.loop = true;
    out.prewarm = false;
    out.startDelay = { __type__: 'MinMaxCurve', ...minMaxCurveDefault() };
    out.startLifetime = { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1: true, constant: 5, constantMin: 5, constantMax: 5 };
    out.startSpeed = { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 5, constantMin: 5, constantMax: 5 };
    out.useStartSize3D = false;
    out.startSize3D = particleModuleVector3CurveDefault(1, true, 1);
    out.useStartRotation3D = false;
    out.startRotation3D = particleModuleVector3CurveDefault(0, false, Math.PI);
    out.randomizeRotationDirection = 0;
    out.startColor = { __type__: 'MinMaxGradient', ...minMaxGradientDefault() };
    out.gravityModifier = { __type__: 'MinMaxCurve', ...minMaxCurveDefault() };
    out.simulationSpace = ParticleSystemSimulationSpace.Local;
    out.simulationSpeed = 1;
    out.scalingMode = ParticleSystemScalingMode.Local;
    out.playOnAwake = true;
    out.maxParticles = 1000;

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleMainModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleMainModuleInitParticleState(module: ParticleMainModule, particle: Particle): void
{
    //
    const birthRateAtDuration = particle.birthRateAtDuration;

    vec3From(0, 0, 0, particle.velocity);
    vec3From(0, 0, 0, particle.acceleration);
    if (module.useStartSize3D)
    {
        vec3Copy(minMaxCurveVector3GetValue(module.startSize3D, birthRateAtDuration), particle.startSize);
    }
    else
    {
        const startSize = minMaxCurveGetValue(module.startSize3D.xCurve, birthRateAtDuration);
        vec3From(startSize, startSize, startSize, particle.startSize);
    }

    //
    if (module.useStartRotation3D)
    {
        vec3Copy(minMaxCurveVector3GetValue(module.startRotation3D, birthRateAtDuration), particle.rotation);
    }
    else
    {
        // 与原 class 的 `get startRotation()` 一致：非分轴模式下由 **zCurve** 承载整体旋转
        const startRotation = minMaxCurveGetValue(module.startRotation3D.zCurve, birthRateAtDuration);
        vec3From(0, 0, startRotation, particle.rotation);
    }
    vec3From(0, 0, 0, particle.angularVelocity);
    //
    color4Copy(minMaxGradientGetValue(module.startColor, birthRateAtDuration), particle.startColor);
}

/**
 * 更新粒子状态（原 `ParticleMainModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleMainModuleUpdateParticleState(module: ParticleMainModule, particle: Particle): void
{
    // 加速度
    const gravity = vec3ScaleNumber(worldGravity, minMaxCurveGetValue(module.gravityModifier, module.particleSystem!.emitInfo.rateAtDuration));
    module.particleSystem!.addParticleAcceleration(particle, gravity, ParticleSystemSimulationSpace.World, MainPreGravity);

    //
    vec3Copy(particle.startSize, particle.size);
    color4Copy(particle.startColor, particle.color);
}

const worldGravity = { x: 0, y: -9.8, z: 0 };
const MainPreGravity = '_Main_preGravity';
