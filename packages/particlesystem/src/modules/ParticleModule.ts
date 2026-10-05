import { minMaxCurveDefault, minMaxCurveVector3Default } from '@feng3d/math';
import type { MinMaxCurve, MinMaxCurveVector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { EventEmitter } from '@feng3d/event';
import { Particle } from '../Particle';
import { ParticleSystem } from '../ParticleSystem';
import { decoratorRegisterClass } from '@feng3d/polyfill';

/**
 * 粒子模块的**读侧形状**（模块纯数据化批：已迁移模块改用它，未迁移的仍继承下面的 class）。
 *
 * 模块是纯数据容器 + 模块级行为函数（`particleXxxModuleInitParticleState` 等）；
 * `particleSystem` 是运行时反向引用（不参与序列化），`enabled` 是开关。
 */
export interface ParticleModuleLike
{
    /** 是否开启 */
    readonly enabled: boolean;

    /** 粒子系统（由 ParticleSystem 的 setter 注入） */
    readonly particleSystem?: ParticleSystem;
}

/** 可写出的粒子模块（写侧形状）。 */
export interface WritableParticleModuleLike
{
    enabled: boolean;
    particleSystem?: ParticleSystem;
}

/**
 * 生成「三条轴曲线同常量 / 区间标志 / 乘数」的 `MinMaxCurveVector3`。
 *
 * 模块默认值里 `size3D` / `angularVelocity` / `limit3D` 都是这个形态，抽出来避免三处各写一遍。
 *
 * @param constant 三条曲线的常量值
 * @param between0And1 是否把取值区间约束到 [0,1]
 * @param curveMultiplier 曲线乘数
 */
export function particleModuleVector3CurveDefault(constant: number, between0And1: boolean, curveMultiplier: number): MinMaxCurveVector3
{
    const axis = (): MinMaxCurve => ({ __type__: 'MinMaxCurve', ...minMaxCurveDefault(), between0And1, constant, constantMin: constant, constantMax: constant, curveMultiplier });

    return { __type__: 'MinMaxCurveVector3', ...minMaxCurveVector3Default(), xCurve: axis(), yCurve: axis(), zCurve: axis() };
}

/**
 * 粒子模块（**仅剩未迁移模块继承的过渡 class**，迁移完成后删除）
 */
@decoratorRegisterClass()
export class ParticleModule extends EventEmitter
{
    /**
     * 是否开启
     */
    @oav({ tooltip: '是否开启' })
    @serialize
    enabled = false;

    /**
     * 粒子系统
     */
    particleSystem: ParticleSystem;

    /**
     * 初始化粒子状态
     * @param _particle 粒子
     */
    initParticleState(_particle: Particle)
    {

    }

    /**
     * 更新粒子状态
     * @param _particle 粒子
     */
    updateParticleState(_particle: Particle)
    {

    }

    /**
     * 更新
     *
     * @param _interval
     */
    update(_interval: number)
    {
    }
}
