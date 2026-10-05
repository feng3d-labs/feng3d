import { mathUtilClamp, minMaxCurveVector3GetValue, vec3Add, vec3Copy, vec3From, vec3Length, vec3Sub } from '@feng3d/math';
import type { MinMaxCurveVector3, Vector2Like, Vector3 } from '@feng3d/math';
import type { Particle } from '../Particle';
import { particleModuleVector3CurveDefault, type ParticleModuleLike, type WritableParticleModuleLike } from './ParticleModule';
/**
 * 旋转随速度变化模块（纯数据接口 + 模块级行为函数）。
 */
export interface ParticleRotationBySpeedModuleLike extends ParticleModuleLike
{
    /** 是否分轴设置 */
    readonly separateAxes: boolean;

    /** 角速度曲线（三条轴） */
    readonly angularVelocity: MinMaxCurveVector3;

    /** 速度归一化区间 */
    readonly range: Vector2Like;
}

/** 可写出的旋转随速度变化模块（写侧形状）。 */
export interface WritableParticleRotationBySpeedModuleLike extends WritableParticleModuleLike
{
    separateAxes: boolean;
    angularVelocity: MinMaxCurveVector3;
    range: Vector2Like;
}

/** 纯数据「旋转随速度变化模块」（带判别字段）。 */
export interface ParticleRotationBySpeedModule extends ParticleRotationBySpeedModuleLike
{
    readonly __type__: 'ParticleRotationBySpeedModule';
}

/**
 * `new ParticleRotationBySpeedModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleRotationBySpeedModuleDefault(out: WritableParticleRotationBySpeedModuleLike = { enabled: false, separateAxes: false, angularVelocity: particleModuleVector3CurveDefault(Math.PI / 4, false, Math.PI / 4), range: { x: 0, y: 1 } }): WritableParticleRotationBySpeedModuleLike
{
    out.enabled = false;
    out.separateAxes = false;
    out.angularVelocity = particleModuleVector3CurveDefault(Math.PI / 4, false, Math.PI / 4);
    out.range = { x: 0, y: 1 };

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleRotationBySpeedModule.initParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleRotationBySpeedModuleInitParticleState(module: ParticleRotationBySpeedModuleLike, particle: Particle): void
{
    particle[RotationBySpeedRate] = Math.random();
    particle[RotationBySpeedPreAngularVelocity] = { x: 0, y: 0, z: 0 };
}

/**
 * 更新粒子状态（原 `ParticleRotationBySpeedModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleRotationBySpeedModuleUpdateParticleState(module: ParticleRotationBySpeedModuleLike, particle: Particle): void
{
    const preAngularVelocity: Vector3 = particle[RotationBySpeedPreAngularVelocity];
    vec3Sub(particle.angularVelocity, preAngularVelocity, particle.angularVelocity);
    vec3From(0, 0, 0, preAngularVelocity);
    if (!module.enabled) return;

    const velocity = vec3Length(particle.velocity);
    const rate = mathUtilClamp((velocity - module.range.x) / (module.range.y - module.range.x), 0, 1);

    const v = minMaxCurveVector3GetValue(module.angularVelocity, rate, particle[RotationBySpeedRate]);
    if (!module.separateAxes)
    {
        v.x = v.y = 0;
    }
    vec3Add(particle.angularVelocity, v, particle.angularVelocity);
    vec3Copy(v, preAngularVelocity);
}

const RotationBySpeedRate = '_RotationBySpeed_rate';
const RotationBySpeedPreAngularVelocity = '_RotationBySpeed_preAngularVelocity';
