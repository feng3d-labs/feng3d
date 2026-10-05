import type { WritableVector3Like } from '../geom/vector3';
import { vec3From } from '../geom/vector3';
import type { AnimationCurve } from './animationCurve';
import { animationCurveDefault, animationCurveGetValue } from './animationCurve';

/**
 * Vector3 动画曲线（issue #134 曲线族批：原 class AnimationCurveVector3 已删除）。
 */
/** 纯函数可接受的最小「Vector3 动画曲线」形状。 */
export interface AnimationCurveVector3Like
{
    /** X 轴曲线 */
    readonly xCurve: AnimationCurve;
    /** Y 轴曲线 */
    readonly yCurve: AnimationCurve;
    /** Z 轴曲线 */
    readonly zCurve: AnimationCurve;
}

/** 可写出的 Vector3 动画曲线（写侧形状）。 */
export interface WritableAnimationCurveVector3Like
{
    xCurve: AnimationCurve;
    yCurve: AnimationCurve;
    zCurve: AnimationCurve;
}

/** 纯数据「Vector3 动画曲线」（带判别字段）。 */
export interface AnimationCurveVector3 extends AnimationCurveVector3Like
{
    readonly __type__: 'AnimationCurveVector3';
}

/** 一条独立的默认曲线（带判别字段） */
function defaultCurve(): AnimationCurve
{
    return { __type__: 'AnimationCurve', ...animationCurveDefault() };
}

/**
 * `new AnimationCurveVector3()` 的纯函数版：三条**互不共享**的默认曲线。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function animationCurveVector3Default(out: WritableAnimationCurveVector3Like = { xCurve: defaultCurve(), yCurve: defaultCurve(), zCurve: defaultCurve() }): WritableAnimationCurveVector3Like
{
    out.xCurve = defaultCurve();
    out.yCurve = defaultCurve();
    out.zCurve = defaultCurve();

    return out;
}

/**
 * `AnimationCurveVector3.getValue` 的纯函数版：三条曲线各自求值后合成向量。
 *
 * @param curve3 Vector3 动画曲线
 * @param time 时间
 */
export function animationCurveVector3GetValue(curve3: AnimationCurveVector3Like, time: number): WritableVector3Like
{
    return vec3From(animationCurveGetValue(curve3.xCurve, time), animationCurveGetValue(curve3.yCurve, time), animationCurveGetValue(curve3.zCurve, time));
}
