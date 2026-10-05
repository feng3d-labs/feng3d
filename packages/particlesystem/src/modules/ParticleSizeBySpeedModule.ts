import { mathUtilClamp, minMaxCurveVector3GetValue, vec3Length, vec3Multiply } from '@feng3d/math';
import type { MinMaxCurveVector3, Vector2Like } from '@feng3d/math';
import type { Particle } from '../Particle';
import { particleModuleVector3CurveDefault, type ParticleModuleLike, type WritableParticleModuleLike } from './ParticleModule';
/**
 * 缩放随速度变化模块（纯数据接口 + 模块级行为函数）。
 */
export interface ParticleSizeBySpeedModuleLike extends ParticleModuleLike
{
    /** 是否分轴设置 */
    readonly separateAxes?: boolean;

    /** 按速度取尺寸的曲线（三条轴） */
    readonly size3D?: MinMaxCurveVector3;

    /** 速度归一化区间 */
    readonly range?: Vector2Like;
}

/** 可写出的缩放随速度变化模块（写侧形状）。 */
export interface WritableParticleSizeBySpeedModuleLike extends WritableParticleModuleLike
{
    separateAxes: boolean;
    size3D: MinMaxCurveVector3;
    range: Vector2Like;
}

/** 纯数据「缩放随速度变化模块」（带判别字段）。 */
export interface ParticleSizeBySpeedModule extends Required<ParticleSizeBySpeedModuleLike>
{
    readonly __type__: 'ParticleSizeBySpeedModule';
}

/**
 * `new ParticleSizeBySpeedModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleSizeBySpeedModuleDefault(out: WritableParticleSizeBySpeedModuleLike = { enabled: false, separateAxes: false, size3D: particleModuleVector3CurveDefault(1, true, 1), range: { x: 0, y: 1 } }): WritableParticleSizeBySpeedModuleLike
{
    out.enabled = false;
    out.separateAxes = false;
    out.size3D = particleModuleVector3CurveDefault(1, true, 1);
    out.range = { x: 0, y: 1 };

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleSizeBySpeedModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleSizeBySpeedModuleInitParticleState(module: ParticleSizeBySpeedModule, particle: Particle): void
{
    particle[SizeBySpeedRate] = Math.random();
}

/**
 * 更新粒子状态（原 `ParticleSizeBySpeedModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleSizeBySpeedModuleUpdateParticleState(module: ParticleSizeBySpeedModule, particle: Particle): void
{
    if (!module.enabled) return;

    const velocity = vec3Length(particle.velocity);
    const rate = mathUtilClamp((velocity - module.range.x) / (module.range.y - module.range.x), 0, 1);
    const size = minMaxCurveVector3GetValue(module.size3D, rate, particle[SizeBySpeedRate]);
    if (!module.separateAxes)
    {
        size.y = size.z = size.x;
    }
    vec3Multiply(particle.size, size, particle.size);
}

const SizeBySpeedRate = '_SizeBySpeed_rate';
