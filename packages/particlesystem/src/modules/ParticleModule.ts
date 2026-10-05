import { minMaxCurveDefault, minMaxCurveVector3Default } from '@feng3d/math';
import type { MinMaxCurve, MinMaxCurveVector3 } from '@feng3d/math';
import type { ParticleSystemLogic } from '../ParticleSystem';

/**
 * 粒子模块的**读侧形状**。
 *
 * 模块是纯数据容器 + 模块级行为函数（`particleXxxModuleInitParticleState` 等）；
 * `particleSystem` 是运行时反向引用（不参与序列化），`enabled` 是开关。
 *
 * 原 `ParticleModule` 过渡 class 已在 16 个模块全部纯数据化后删除（本文件不再有 class）。
 */
export interface ParticleModuleLike
{
    /** 是否开启 */
    readonly enabled?: boolean;

    /** 粒子系统（由 ParticleSystem 的 setter 注入） */
    readonly particleSystem?: ParticleSystemLogic;
}

/** 可写出的粒子模块（写侧形状）。 */
export interface WritableParticleModuleLike
{
    enabled?: boolean;
    particleSystem?: ParticleSystemLogic;
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
