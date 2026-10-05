import { color4Multiply, mathUtilClamp, minMaxGradientDefault, minMaxGradientGetValue, vec3Length } from '@feng3d/math';
import type { MinMaxGradient, Vector2Like } from '@feng3d/math';
import type { Particle } from '../Particle';
import type { ParticleModuleLike, WritableParticleModuleLike } from './ParticleModule';

/**
 * 颜色随速度变化模块（纯数据接口 + 模块级行为函数）。
 */
export interface ParticleColorBySpeedModuleLike extends ParticleModuleLike
{
    /** 控制粒子颜色的梯度 */
    readonly color: MinMaxGradient;

    /** 在这些最小和最大速度之间应用颜色渐变 */
    readonly range: Vector2Like;
}

/** 可写出的颜色随速度变化模块（写侧形状）。 */
export interface WritableParticleColorBySpeedModuleLike extends WritableParticleModuleLike
{
    color: MinMaxGradient;
    range: Vector2Like;
}

/** 纯数据「颜色随速度变化模块」（带判别字段）。 */
export interface ParticleColorBySpeedModule extends ParticleColorBySpeedModuleLike
{
    readonly __type__: 'ParticleColorBySpeedModule';
}

/**
 * `new ParticleColorBySpeedModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleColorBySpeedModuleDefault(out: WritableParticleColorBySpeedModuleLike = { enabled: false, color: { __type__: 'MinMaxGradient', ...minMaxGradientDefault() }, range: { x: 0, y: 1 } }): WritableParticleColorBySpeedModuleLike
{
    out.enabled = false;
    out.color = { __type__: 'MinMaxGradient', ...minMaxGradientDefault() };
    out.range = { x: 0, y: 1 };

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleColorBySpeedModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleColorBySpeedModuleInitParticleState(module: ParticleColorBySpeedModuleLike, particle: Particle): void
{
    particle[ColorBySpeedRate] = Math.random();
}

/**
 * 更新粒子状态（原 `ParticleColorBySpeedModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleColorBySpeedModuleUpdateParticleState(module: ParticleColorBySpeedModuleLike, particle: Particle): void
{
    if (!module.enabled) return;

    const velocity = vec3Length(particle.velocity);
    const rate = mathUtilClamp((velocity - module.range.x) / (module.range.y - module.range.x), 0, 1);
    const color = minMaxGradientGetValue(module.color, rate, particle[ColorBySpeedRate]);

    color4Multiply(particle.color, color, particle.color);
}

const ColorBySpeedRate = '_ColorBySpeed_rate';
