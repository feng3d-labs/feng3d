import type { WritableVector3Like } from '../geom/vector3';
import { vec3From } from '../geom/vector3';
import type { MinMaxCurve } from './minMaxCurve';
import { minMaxCurveDefault, minMaxCurveGetValue } from './minMaxCurve';

/**
 * 最大最小 Vector3 曲线（issue #134 曲线族批：原 class MinMaxCurveVector3 已删除）。
 */
/** 纯函数可接受的最小「最大最小 Vector3 曲线」形状。 */
export interface MinMaxCurveVector3Like
{
    /** x 曲线 */
    readonly xCurve: MinMaxCurve;
    /** y 曲线 */
    readonly yCurve: MinMaxCurve;
    /** z 曲线 */
    readonly zCurve: MinMaxCurve;
}

/** 可写出的最大最小 Vector3 曲线（写侧形状）。 */
export interface WritableMinMaxCurveVector3Like
{
    xCurve: MinMaxCurve;
    yCurve: MinMaxCurve;
    zCurve: MinMaxCurve;
}

/** 纯数据「最大最小 Vector3 曲线」（带判别字段）。 */
export interface MinMaxCurveVector3 extends MinMaxCurveVector3Like
{
    readonly __type__: 'MinMaxCurveVector3';
}

/** 一条独立的默认曲线（带判别字段） */
function defaultCurve(): MinMaxCurve
{
    return { __type__: 'MinMaxCurve', ...minMaxCurveDefault() };
}

/**
 * `new MinMaxCurveVector3()` 的纯函数版：三条**互不共享**的默认曲线。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function minMaxCurveVector3Default(out: WritableMinMaxCurveVector3Like = { xCurve: defaultCurve(), yCurve: defaultCurve(), zCurve: defaultCurve() }): WritableMinMaxCurveVector3Like
{
    out.xCurve = defaultCurve();
    out.yCurve = defaultCurve();
    out.zCurve = defaultCurve();

    return out;
}

/**
 * `MinMaxCurveVector3.getValue` 的纯函数版：三条曲线各自求值后合成向量。
 *
 * @param curve3 Vector3 曲线
 * @param time 时间
 * @param randomBetween 两个边界之间的随机插值系数
 */
export function minMaxCurveVector3GetValue(curve3: MinMaxCurveVector3Like, time: number, randomBetween: number = Math.random()): WritableVector3Like
{
    return vec3From(minMaxCurveGetValue(curve3.xCurve, time, randomBetween), minMaxCurveGetValue(curve3.yCurve, time, randomBetween), minMaxCurveGetValue(curve3.zCurve, time, randomBetween));
}
