import { mathUtilLerp } from '../mathutil';
import type { AnimationCurve } from './animationCurve';
import { animationCurveDefault, animationCurveGetValue } from './animationCurve';
import { MinMaxCurveMode } from './MinMaxCurveMode';

/**
 * 最大最小曲线的数据定义与**纯函数**形式（issue #134 曲线族批：原 class MinMaxCurve 已删除）。
 *
 * | 原 class 成员 | 纯函数 |
 * |---|---|
 * | `new MinMaxCurve()` | `minMaxCurveDefault(out?)` |
 * | `getValue(time, randomBetween?)` | `minMaxCurveGetValue(curve, time, randomBetween?)` |
 *
 * 字段默认值与原 class 逐字一致：`mode = Constant`、三个数值 0、三条**各自独立**的默认曲线、
 * `curveMultiplier = 1`、`between0And1 = false`。
 */

/** 纯函数可接受的最小「最大最小曲线」形状。 */
export interface MinMaxCurveLike
{
    /** 模式 */
    readonly mode: MinMaxCurveMode;
    /** 常数值 */
    readonly constant: number;
    /** 下界常数 */
    readonly constantMin: number;
    /** 上界常数 */
    readonly constantMax: number;
    /** 曲线 */
    readonly curve: AnimationCurve;
    /** 下界曲线 */
    readonly curveMin: AnimationCurve;
    /** 上界曲线 */
    readonly curveMax: AnimationCurve;
    /** 应用于曲线的乘数 */
    readonly curveMultiplier: number;
    /** 是否在编辑器中只显示 Y 轴 0-1 区域（lifetime 等非负量用） */
    readonly between0And1: boolean;
}

/** 可写出的最大最小曲线（写侧形状）。 */
export interface WritableMinMaxCurveLike
{
    mode: MinMaxCurveMode;
    constant: number;
    constantMin: number;
    constantMax: number;
    curve: AnimationCurve;
    curveMin: AnimationCurve;
    curveMax: AnimationCurve;
    curveMultiplier: number;
    between0And1: boolean;
}

/** 纯数据「最大最小曲线」（带判别字段）。 */
export interface MinMaxCurve extends MinMaxCurveLike
{
    readonly __type__: 'MinMaxCurve';
}

/** 一条独立的默认曲线（带判别字段） */
function defaultCurve(): AnimationCurve
{
    return { __type__: 'AnimationCurve', ...animationCurveDefault() };
}

/** 缺省输出目标：与原 `new MinMaxCurve()` 的字段默认值逐字一致 */
function defaultOut(): WritableMinMaxCurveLike
{
    return {
        mode: MinMaxCurveMode.Constant,
        constant: 0,
        constantMin: 0,
        constantMax: 0,
        curve: defaultCurve(),
        curveMin: defaultCurve(),
        curveMax: defaultCurve(),
        curveMultiplier: 1,
        between0And1: false,
    };
}

/**
 * `new MinMaxCurve()` 的纯函数版：九个字段的默认值写进 `out`（缺省新建）。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function minMaxCurveDefault(out: WritableMinMaxCurveLike = defaultOut()): WritableMinMaxCurveLike
{
    out.mode = MinMaxCurveMode.Constant;
    out.constant = 0;
    out.constantMin = 0;
    out.constantMax = 0;
    out.curve = defaultCurve();
    out.curveMin = defaultCurve();
    out.curveMax = defaultCurve();
    out.curveMultiplier = 1;
    out.between0And1 = false;

    return out;
}

/**
 * `MinMaxCurve.getValue` 的纯函数版：按 `mode` 求值。
 *
 * 与原实现逐字一致（含 `randomBetween` 缺省为 `Math.random()`）。
 *
 * @param minMaxCurve 数据（须已由 minMaxCurveDefault 补全字段）
 * @param time 时间
 * @param randomBetween 两个边界之间的随机插值系数
 */
export function minMaxCurveGetValue(minMaxCurve: MinMaxCurveLike, time: number, randomBetween: number = Math.random()): number
{
    switch (minMaxCurve.mode)
    {
        case MinMaxCurveMode.Constant:
            return minMaxCurve.constant;
        case MinMaxCurveMode.Curve:
            return animationCurveGetValue(minMaxCurve.curve, time) * minMaxCurve.curveMultiplier;
        case MinMaxCurveMode.TwoConstants:
            return mathUtilLerp(minMaxCurve.constantMin, minMaxCurve.constantMax, randomBetween);
        case MinMaxCurveMode.TwoCurves:
            return mathUtilLerp(animationCurveGetValue(minMaxCurve.curveMin, time), animationCurveGetValue(minMaxCurve.curveMax, time), randomBetween) * minMaxCurve.curveMultiplier;
    }

    return minMaxCurve.constant;
}
